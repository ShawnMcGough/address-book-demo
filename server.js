const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Data file path
const dataFile = path.join(__dirname, 'addresses.json');

// Ensure addresses.json exists
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]));
}

// Get all addresses
app.get('/addresses', (req, res) => {
    const addresses = JSON.parse(fs.readFileSync(dataFile));
    res.json(addresses);
});

// Add new address
app.post('/addresses', (req, res) => {
    const { firstName, lastName, streetAddress } = req.body;
    if (!firstName || !lastName || !streetAddress) {
        return res.status(400).send('All fields are required');
    }

    const addresses = JSON.parse(fs.readFileSync(dataFile));
    const newAddress = {
        id: Date.now(), // Simple unique ID
        firstName,
        lastName,
        streetAddress
    };
    addresses.push(newAddress);
    fs.writeFileSync(dataFile, JSON.stringify(addresses, null, 2));
    res.status(201).json(newAddress);
});

// Simple HTML frontend
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Address Book</title>
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Address Book</h1>
            
            <h2>Add New Address</h2>
            <form id="addressForm">
                <input type="text" id="firstName" placeholder="First Name" required><br><br>
                <input type="text" id="lastName" placeholder="Last Name" required><br><br>
                <input type="text" id="streetAddress" placeholder="Street Address" required><br><br>
                <button type="submit">Add Address</button>
            </form>

            <h2>Current Addresses</h2>
            <table id="addressTable">
                <thead>
                    <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Street Address</th>
                    </tr>
                </thead>
                <tbody id="addressList"></tbody>
            </table>

            <script>
                // Load addresses on page load
                fetch('/addresses')
                    .then(res => res.json())
                    .then(addresses => displayAddresses(addresses));

                // Form submission
                document.getElementById('addressForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const address = {
                        firstName: document.getElementById('firstName').value,
                        lastName: document.getElementById('lastName').value,
                        streetAddress: document.getElementById('streetAddress').value
                    };

                    fetch('/addresses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(address)
                    })
                    .then(res => res.json())
                    .then(() => {
                        document.getElementById('addressForm').reset();
                        loadAddresses();
                    });
                });

                function displayAddresses(addresses) {
                    const tbody = document.getElementById('addressList');
                    tbody.innerHTML = '';
                    addresses.forEach(addr => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = \`
                            <td>\${addr.firstName}</td>
                            <td>\${addr.lastName}</td>
                            <td>\${addr.streetAddress}</td>
                        \`;
                        tbody.appendChild(tr);
                    });
                }

                function loadAddresses() {
                    fetch('/addresses')
                        .then(res => res.json())
                        .then(addresses => displayAddresses(addresses));
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});