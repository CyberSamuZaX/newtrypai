export default function handler(req, res) {
  const { number } = req.query;

  if (!number || number.length < 8) {
    res.status(400).json({ code: "Invalid number!" });
    return;
  }

  // 8 characters random uppercase code generate කරන function එක
  function generateCode(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const randomCode = generateCode(8);

  res.status(200).json({ code: randomCode });
}
