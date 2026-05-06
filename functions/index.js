const { onRequest } = require('firebase-functions/v2/https');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const express = require('express');
const admin = require('firebase-admin');

function getDb() {
  if (!admin.apps.length) admin.initializeApp();
  return admin.firestore();
}

function decodeBase64(encoded) {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

// Configuration du transporteur avec Hostinger SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: 'no-reply@edu.maykconsulting.fr',
        pass: 'Rennes*12301'
    }
});

// Initialisation de l'application Express
const app = express();
app.use(express.json());

// Middleware CORS
app.use(cors);

// Route pour l'envoi d'email
app.post('/sendEmail', (req, res) => {
    const { to, subject, html } = req.body;

    const mailOptions = {
        from: 'no-reply@edu.maykconsulting.fr',
        to: to,
        subject: subject,
        html: html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erreur lors de l\'envoi de l\'email', error);
            return res.status(500).send(error.toString());
        }
        console.log('Email envoyé avec succès', info.response);
        return res.status(200).send('Email envoyé: ' + info.response);
    });
});

// Nouvelle route pour la génération de PDF
app.post('/generatePdf', async (req, res) => {
    const html = req.body.html;

    if (!html) {
        console.error('Missing HTML content');
        return res.status(400).send('Missing HTML content');
    }

    try {
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: 'networkidle0',
        });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '10mm',
                right: '10mm'
            },
            preferCSSPageSize: true
        });

        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=generated.pdf',
        });

        res.send(pdf);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ── Route : synchronisation Campus France ──
app.post('/syncCampusFrance', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requis' });

  let browser;
  try {
    // 1. Récupérer les credentials depuis Firestore
    const db = getDb();
    const credDoc = await db
      .collection('credentials').doc(userId)
      .collection('platforms').doc('campusfrance')
      .get();

    if (!credDoc.exists) {
      return res.status(404).json({ error: 'Credentials Campus France non trouvés pour cet étudiant' });
    }

    const { username, password: encodedPwd } = credDoc.data();
    const password = decodeBase64(encodedPwd);

    // 2. Lancer le navigateur
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    await page.setViewport({ width: 1280, height: 800 });

    // 3. Page de login
    await page.goto(
      'https://pastel.diplomatie.gouv.fr/etudesenfrance/dyn/public/authentification/login.html',
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    await new Promise(r => setTimeout(r, 2000));

    // 4. Ouvrir le modal DSFR en cliquant sur le bouton #jeMeConnecte
    try {
      await page.waitForSelector('#jeMeConnecte', { visible: true, timeout: 10000 });
      await page.click('#jeMeConnecte');
    } catch (e) {
      // Fallback : essayer via XPath si l'id change
      try {
        const [connectBtn] = await page.$x('//*[contains(text(),"Je me connecte")]');
        if (connectBtn) await connectBtn.click();
      } catch (e2) {}
    }

    // 5. Attendre que le dialog soit ouvert (DSFR ajoute l'attribut open)
    await page.waitForSelector('dialog[open] input[placeholder="Identifiant"]', { visible: true, timeout: 15000 });

    const usernameEl = await page.$('dialog[open] input[placeholder="Identifiant"]');
    if (!usernameEl) throw new Error('Champ identifiant introuvable dans le modal Campus France');
    await usernameEl.click({ clickCount: 3 });
    await usernameEl.type(username);

    const pwdEl = await page.$('dialog[open] input[placeholder="Mot de passe"]');
    if (!pwdEl) throw new Error('Champ mot de passe introuvable dans le modal Campus France');
    await pwdEl.click({ clickCount: 3 });
    await pwdEl.type(password);

    // 6. Soumettre (navigation démarrée AVANT le clic pour éviter la race condition)
    const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.click('dialog[open] button[type="submit"], dialog[open] #loginConnexionButton, dialog[open] button[title="Se connecter"], #loginConnexionButton, button[title="Se connecter"]');
    await navPromise;
    await new Promise(r => setTimeout(r, 2000));

    // 7. Vérifier que la connexion a réussi
    if (page.url().includes('authentification') || page.url().includes('login')) {
      await browser.close();
      return res.status(401).json({ error: 'Identifiants Campus France incorrects' });
    }

    // 8. Naviguer vers la page des candidatures
    await page.goto(
      'https://pastel.diplomatie.gouv.fr/etudesenfrance/dyn/protected/etudiant/ET_CAN/initCandidature.html',
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    await new Promise(r => setTimeout(r, 2000));

    // 9. Scraper tous les tableaux de la page
    const responses = await page.evaluate(() => {
      const results = [];
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        // Titre de section (h2/h3 précédant le tableau)
        let section = '';
        let prev = table.previousElementSibling;
        while (prev) {
          if (/^H[1-4]$/.test(prev.tagName)) { section = prev.textContent.trim(); break; }
          prev = prev.previousElementSibling;
        }

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 4) return;

          const formation     = cells[0]?.textContent?.trim() || '';
          const annee         = cells[1]?.textContent?.trim() || '';
          const etablissement = cells[2]?.textContent?.trim() || '';
          const ville         = cells[3]?.textContent?.trim() || '';
          // colonne réponse = index 5 si logo présent à index 4, sinon index 4
          const reponse = (cells[5]?.textContent?.trim() || cells[4]?.textContent?.trim() || '').replace(/\s+/g, ' ');

          if (formation && etablissement) {
            results.push({ section, formation, annee, etablissement, ville, reponse });
          }
        });
      });
      return results;
    });

    await browser.close();
    browser = null;

    // 10. Sauvegarder dans Firestore
    const syncedAt = admin.firestore.Timestamp.now();
    await db.collection('admissions').doc(userId).update({
      cfResponses: responses,
      cfLastSync: syncedAt
    });

    return res.status(200).json({ responses, syncedAt: syncedAt.toDate().toISOString(), count: responses.length });

  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    console.error('Erreur sync Campus France:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Exporte les fonctions HTTP
exports.api = onRequest({ timeoutSeconds: 300, memory: '1GiB' }, app);
