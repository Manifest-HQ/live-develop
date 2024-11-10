export function ALL(req, res) {
  res.status(200).json({ message: 'Projects all' })
}

export function GET(req, res) {
  res.status(200).json({ message: 'Projects get' })
}
