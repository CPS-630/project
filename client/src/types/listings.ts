export interface ListingInfo {
  id: number
  postDate: string
  title: string
  location: string
  description: string
  adType: string
  categories: string[]
  price: string
}

export const convertType = async (input: string): Promise<string> => {
  if (input === 'W') {
    return 'Wanted'
  } else if (input === 'A') {
    return 'Academic Service'
  } else {
    return 'Selling'
  }
}
