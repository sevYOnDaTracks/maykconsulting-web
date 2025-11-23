const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// Configuration de votre service email avec Mailtrap
const transporter = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",  // Remplacez par le host de Mailtrap
    port: 587,  // Le port SMTP de Mailtrap
    auth: {
        user: "api",  // Remplacez par votre identifiant Mailtrap
        pass: "64ff6202a62179784d1ffa3dd0546b97"  // Remplacez par votre mot de passe Mailtrap
    }
});

exports.sendEmail = functions.https.onRequest((req, res) => {
    const mailOptions = {
        from: 'noreply@maykconsulting.com',  // Adresse email fictive ou celle que vous utilisez pour l'envoi
        to: req.body.to,  // Adresse email du destinataire
        subject: req.body.subject,
        text: req.body.text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        return res.status(200).send('Email envoyé: ' + info.response);
    });
});
