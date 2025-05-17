// api/pair.js
export default function handler(req, res) {
  const { number } = req.query;

  if (!number || number.length < 8) {
    res.status(400).json({ code: "Invalid number!" });
    return;
  }

  // Random pair code generate කිරීම
  const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  res.status(200).json({ code: randomCode });
}
