const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const atob = require('atob');
const fileType = require('file-type');  // To detect file MIME type from Base64\
const cors = require('cors');

const app = express();
const upload = multer();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helper functions
const isPrime = (num) => {
  if (num <= 1) return false;
  if (num <= 3) return true;

  if (num % 2 === 0 || num % 3 === 0) return false;

  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }

  return true;
};

// Function to check if a string is valid base64
const isBase64 = (str) => {
  const regex = /^([A-Za-z0-9+/=]+)$/;
  return regex.test(str);
};

// Helper to decode base64 and determine MIME type & size
const getFileInfoFromBase64 = async (base64String) => {
  const buffer = Buffer.from(base64String, 'base64');
  const fileInfo = await fileType.fromBuffer(buffer);
  if (fileInfo) {
    const fileSizeInKB = Math.round(buffer.length / 1024);  // File size in KB
    return {
      mimeType: fileInfo.mime,
      fileSizeInKB,
      fileValid: true
    };
  }
  return {
    mimeType: null,
    fileSizeInKB: 0,
    fileValid: false
  };
};

// Routes
app.route('/bfhl')
  .get((req, res) => {
    res.status(200).json({ operation_code: 1 });
  })
  .post(upload.none(), async (req, res) => {
    const { data, file_b64 } = req.body;
    const response = {
      is_success: true,
      user_id: 'atharv_sharma',  // Replace with your full name and DOB
      email: 'atharvsharma210921@acropolis.in',
      roll_number: '0827IT211022',
      numbers: [],
      alphabets: [],
      highest_lowercase_alphabet: [],
      is_prime_found: false,
      file_valid: false,
      file_mime_type: null,
      file_size_kb: null
    };

    // Validate input data
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ is_success: false, message: 'Invalid input data' });
    }

    let highestAlphabet = '';

    // Process the data for numbers and alphabets
    data.forEach(item => {
      if (!isNaN(item)) {
        response.numbers.push(item);
        if (isPrime(parseInt(item, 10))) {
          response.is_prime_found = true;
        }
      } else if (typeof item === 'string' && item.length === 1 && isNaN(item)) {
        response.alphabets.push(item);
        if (item === item.toLowerCase() && (highestAlphabet === '' || item > highestAlphabet)) {
          highestAlphabet = item;
        }
      }
    });

    // Add highest lowercase alphabet to the response
    if (highestAlphabet) {
      response.highest_lowercase_alphabet.push(highestAlphabet);
    }

    // Process the Base64 file if present
    if (file_b64 && isBase64(file_b64)) {
      try {
        const { mimeType, fileSizeInKB, fileValid } = await getFileInfoFromBase64(file_b64);

        // Valid file check (allow certain MIME types)
        const allowedMimeTypes = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/zip'
        ];

        if (allowedMimeTypes.includes(mimeType)) {
          response.file_valid = fileValid;
          response.file_mime_type = mimeType;
          response.file_size_kb = fileSizeInKB;
        } else {
          response.file_valid = false;
        }
      } catch (error) {
        response.file_valid = false;
        console.error('Error processing file:', error);
      }
    }

    res.json(response);
  });

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server is running");
});
