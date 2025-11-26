const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const uploadToIPFS = async (filepath) => {
    const data = new FormData();
    data.append("file", fs.createReadStream(filepath));

    try {
        const res = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data,
            {
                maxBodyLength: Infinity,
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
                    Authorization: `Bearer ${process.env.PINATA_JWT}`,
                },
            }
        );

        console.log("📁 Uploaded to Pinata:", res.data.IpfsHash);
        return res.data.IpfsHash;

    } catch (err) {
        console.error("❌ Pinata upload failed:", err.response?.data || err.message);
        throw err;
    }
};

module.exports = uploadToIPFS;