/* Shared colour language: one hue per project hall, one per evidence type. */
export const CAT_COLOR: Record<string, string> = {
  'Computer Vision & AI': '#ff6a3d',
  'University ERP & Result Management': '#37d7ff',
  'Enterprise Systems': '#9a8bff',
  'Web Applications': '#ffc83d',
  'Desktop Applications': '#45e6a0',
  'Mobile Applications': '#ff5fa2',
  'Developer Tools': '#6f9bff',
  'Workflow Automation': '#ff9f5a',
}

export const HALL_NO: Record<string, string> = {
  'Computer Vision & AI': 'Hall 01',
  'University ERP & Result Management': 'Hall 02',
  'Enterprise Systems': 'Hall 03',
  'Web Applications': 'Hall 04',
  'Desktop Applications': 'Hall 05',
  'Mobile Applications': 'Hall 06',
  'Developer Tools': 'Hall 07',
  'Workflow Automation': 'Hall 08',
}

export const EV_COLOR: Record<string, string> = {
  cv: '#9a8bff',
  project: '#37d7ff',
  exploring: '#c8ff3d',
}
