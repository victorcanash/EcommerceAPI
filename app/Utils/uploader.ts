export const generateUniqueFilename = (filename: string) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
  return `${uniqueSuffix}-${filename}`
}
