require('dotenv').config();
const express = require('express');
const app = express();
const Nightmare = require('nightmare'); //nightmare will help to find the url and price value in the url block
const nightmare = Nightmare();
const port = 3000;
const sgmail = require('postmark');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
 
let client = new sgmail.ServerClient(process.env.API_KEY);
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Example route to send email
app.post('/send-email', (req, res) => {
    const { userEmail, url, price } = req.body;
    sendEmail(userEmail, url, price)
        .then(() => res.status(200).send('Email sent successfully'))
        .catch(err => res.status(500).send('Error sending email'));
});
function sendEmail(userEmail, url, price) {
    let message = {
        to: userEmail,
        from: 'samhitaveluri@gmail.com',
        subject: 'Price has dropped',
        text: `The price on ${url} has dropped below ${price}`,
        html: `<strong>The price on ${url} has dropped below ${price}</strong>`,
    }
    return sgMail.sendEmail(message);
}

const checkPrice = async (url, price, userEmail) => {
    try {
        let priceInString = await nightmare
            .goto(url)
            .wait('#priceblock_ourprice')
            .evaluate(() => document.querySelector('#priceblock_ourprice').innerText)
            .end();
        let priceInValue = parseFloat(priceInString.replace('₹', ''));
        if (priceInValue < price) {
            console.log(`New Price: ${price}`);
            console.log(`Actual Price: ${priceInValue}`);
            await sendEmail(userEmail, url, price);
            console.log('Email has been sent');
        }
        else {
            console.log('Price is still higher');
        }
    } catch (err) {
        console.log(err);
    }
}

app.post('/products', (req, res) => {
    console.log(req.body.email + ' sent a request');
    checkPrice(req.body.prodUrl, req.body.price, req.body.email);
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
