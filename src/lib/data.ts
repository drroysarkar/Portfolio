/* Every fact below comes from Divyanshu Kumar's CV, project list and project code,
   carried over 1:1 from the original portfolio. */

export const EV: Record<string, string> = {
  cv: 'Listed in CV',
  project: 'Used in a project',
  exploring: 'Exploring',
}

export type Evidence = ('cv' | 'project' | 'exploring')[]

export type Tech = { id: string; name: string; summary: string; evidence: Evidence }

export const TECH: Tech[] = [
  ['c', 'C', 'Low-level systems programming language.', ['cv']],
  ['csharp', 'C#', "Main language of the .NET platform; used for ASP.NET back ends and Windows desktop apps.", ['cv', 'project']],
  ['java', 'Java', 'General-purpose, object-oriented language.', ['cv']],
  ['html', 'HTML', 'Markup language for web pages.', ['cv']],
  ['css', 'CSS', 'Styling language for web pages.', ['cv']],
  ['bootstrap', 'Bootstrap', 'CSS framework for responsive layouts.', ['cv']],
  ['javascript', 'JavaScript', 'Language of the web; runs in browsers and on Node.js.', ['cv']],
  ['mysql', 'MySQL', 'Open-source relational database.', ['cv']],
  ['aspnet-mvc', 'ASP.NET MVC', 'The .NET Framework MVC web framework for server-rendered business applications.', ['cv', 'project']],
  ['aspnet-core', 'ASP.NET Core', "Microsoft's cross-platform web framework; MVC with controllers, views and models.", ['project']],
  ['aspnet-webforms', 'ASP.NET Web Forms', 'Event-driven, page-centric server-side web framework from the .NET Framework era.', ['project']],
  ['sql-server', 'SQL Server', "Microsoft's relational database engine.", ['cv', 'project']],
  ['react', 'React', 'Component-based JavaScript library for user interfaces.', ['project']],
  ['nodejs', 'Node.js', 'JavaScript runtime commonly used for back-end APIs.', ['project']],
  ['express', 'Express', 'Minimal web framework for Node.js.', ['project']],
  ['expo', 'Expo', 'Toolchain and platform for React Native mobile apps.', ['project']],
  ['sqlite', 'SQLite', 'Embedded, file-based relational database, a natural fit for on-device storage.', ['project']],
  ['wpf', 'WPF', 'XAML-based desktop UI framework for Windows.', ['project']],
  ['winforms', 'Windows Forms', 'Event-driven .NET desktop UI framework for Windows.', ['project']],
  ['minio', 'MinIO', 'S3-compatible object storage that can be self-hosted.', ['project']],
  ['ironbarcode', 'IronBarcode', '.NET library for generating and reading barcodes (mentioned in the CV).', ['project']],
  ['zxing', 'ZXing', 'Open-source barcode processing library (mentioned in the CV).', ['project']],
  ['python', 'Python', 'The main ecosystem for image processing and machine learning.', ['project', 'exploring']],
  ['opencv', 'OpenCV', 'Open-source computer-vision library for image processing.', ['project', 'exploring']],
  ['ocr', 'OCR', 'Optical character recognition: turning text in images into machine-readable text.', ['project', 'exploring']],
  ['image-preprocessing', 'Image preprocessing', 'Cleaning and normalising images (contrast, noise, thresholding, cropping) before recognition.', ['exploring']],
  ['crnn', 'CRNN', 'Convolutional Recurrent Neural Network: a CNN feeding a recurrent sequence model, trained with CTC loss.', ['exploring']],
  ['pytorch', 'PyTorch', 'Deep-learning framework. The CRNN, its CTC loss and the training loop in AttendanceMaster are written with it.', ['project']],
  ['tesseract', 'Tesseract', 'Open-source OCR engine. AttendanceMaster uses it in the fallback reader that backs up the CRNN.', ['project']],
  ['flask', 'Flask', 'Python web framework behind the operator and reviewer consoles in AttendanceMaster.', ['project']],
].map(([id, name, summary, evidence]) => ({ id, name, summary, evidence } as Tech))

export const techById = new Map(TECH.map(t => [t.id, t]))

export const CATS = [
  'Computer Vision & AI',
  'University ERP & Result Management',
  'Enterprise Systems',
  'Web Applications',
  'Desktop Applications',
  'Mobile Applications',
  'Developer Tools',
  'Workflow Automation',
]

export type Project = {
  id: string; t: string; c: string; s: 'dev' | 'tbc'; tech: string[]; d: string
  feat?: string[]; limit?: string[]; conf?: string; ident?: string; rel?: string[]; full?: boolean
}

export const PROJECTS: Project[] = [
  { id: 'attendance-master', t: 'AttendanceMaster', c: CATS[0], s: 'dev', tech: ['python', 'opencv', 'ocr', 'image-preprocessing', 'crnn', 'pytorch', 'tesseract', 'flask', 'sql-server'],
    d: 'Reads scanned exam attendance sheets: finds the table, cuts out each Copy No cell and reads the handwriting with a CRNN, backed by a Tesseract-based reader, checks against master data and human review.',
    feat: ['A trained CRNN reads each Copy No cell first; a Tesseract-based reader handles the rows the model is unsure about', 'Operators verify rows, a second operator re-checks them, and duplicate sheets and duplicate copy numbers get their own desks', 'Verified entries are harvested to fine-tune the model again'],
    limit: ['Handwritten Copy No recognition is not reliable yet. About 20–40% is reported, but the metric and test set are not defined, so it is not a benchmark.', 'Real attendance records and student identifiers are confidential and are never published.'], rel: ['data-importer', 'result-management-lnmu'], full: true },
  { id: 'result-management-lnmu', t: 'Result Management — LNMU', c: CATS[1], s: 'tbc', tech: ['aspnet-core'], d: 'University semester-result management built with ASP.NET Core MVC.', conf: 'Production university data and source code are not published.', rel: ['result-management-ddu', 'result-search-portal'] },
  { id: 'result-management-ddu', t: 'Result Management — DDU', c: CATS[1], s: 'tbc', tech: ['aspnet-core'], d: 'University result management built with ASP.NET Core MVC.', rel: ['result-management-lnmu', 'ddu-erp'] },
  { id: 'ddu-erp', t: 'DDU ERP', c: CATS[1], s: 'tbc', tech: ['aspnet-core'], d: 'ERP-related workflows built with ASP.NET Core MVC.', rel: ['result-management-ddu'] },
  { id: 'result-search-portal', t: 'Result Search / Display Portal', c: CATS[1], s: 'tbc', tech: ['aspnet-core'], d: 'Searching and presenting results, built with ASP.NET Core MVC.', rel: ['result-management-lnmu', 'result-management-ddu'] },
  { id: 'examiner-allotment', t: 'Examiner Allotment', c: CATS[2], s: 'tbc', tech: ['aspnet-webforms'], d: 'ASP.NET Web Forms application covering online TR, bulk email sending and supporting pages.', feat: ['Online TR', 'Bulk email sending', 'Other supporting pages'] },
  { id: 'e-library', t: 'E-Library (Online Library Management System)', c: CATS[2], s: 'tbc', tech: ['aspnet-webforms', 'sql-server'], d: 'Library management application: book and user management, transactions, inventory and search.', feat: ['Book management', 'User management', 'Transactions', 'Book entry, updating and deletion', 'Inventory', 'Search'], ident: 'My project list says “E-Library” (ASP.NET Web Forms) and my CV says “Online Library Management System” (ASP.NET and SQL Server). They may be one application, so it is shown once until I confirm.' },
  { id: 'school-erp', t: 'School ERP', c: CATS[2], s: 'tbc', tech: ['aspnet-mvc'], d: 'School-management workflows built with ASP.NET MVC.', rel: ['online-test', 'school-hub'] },
  { id: 'online-test', t: 'Online Test', c: CATS[3], s: 'tbc', tech: ['aspnet-mvc'], d: 'Online testing application built with ASP.NET MVC.', rel: ['school-erp'] },
  { id: 'barcode-generator', t: 'Barcode Generator', c: CATS[4], s: 'tbc', tech: ['csharp', 'winforms', 'ironbarcode', 'zxing'], d: 'Windows Forms application that generates barcodes from XML files and exports them as images.', feat: ['Generates barcodes from XML files', 'Exports generated images as PNG, JPG and JPEG'], ident: 'My CV mentions both IronBarcode and ZXing. Which library does which job is still to be confirmed.' },
  { id: 'e-pharma-inventory', t: 'E-Pharma: Inventory Management', c: CATS[3], s: 'tbc', tech: ['react', 'nodejs'], d: 'Pharmacy inventory management built with React and Node.js.' },
  { id: 'e-tracker', t: 'E-Tracker: Money Management', c: CATS[5], s: 'tbc', tech: ['expo', 'sqlite'], d: 'Mobile money-management app built with Expo and SQLite.' },
  { id: 'school-hub', t: 'School Hub (School Website)', c: CATS[3], s: 'tbc', tech: ['react', 'nodejs', 'express'], d: 'School website giving centralised school information, class schedules, announcements and real-time updates.', feat: ['Centralised school information', 'Class schedules', 'Announcements', 'Real-time updates', 'Responsive interface', 'Backend request handling'], ident: 'My CV describes “School Hub” (React, Node.js, Express) and my project list says “School Website” (React, Node.js). They may be one project, so it is shown once until I confirm.', rel: ['school-erp', 'static-company-website'] },
  { id: 'data-importer', t: 'Data Importer', c: CATS[4], s: 'tbc', tech: ['wpf'], d: 'WPF desktop utility for importing data.', rel: ['data-importer-portal'] },
  { id: 'sql-master-beta', t: 'SQL Master Beta', c: CATS[6], s: 'tbc', tech: ['wpf'], d: 'WPF desktop utility for working with SQL (beta).' },
  { id: 'personal-portfolio', t: 'Personal Portfolio', c: CATS[3], s: 'tbc', tech: ['react'], d: 'An earlier personal portfolio built with React.' },
  { id: 'static-company-website', t: 'Static Company Website', c: CATS[3], s: 'tbc', tech: ['react'], d: 'Company website built with React.', rel: ['school-hub'] },
  { id: 'password-management', t: 'Password Management', c: CATS[3], s: 'tbc', tech: ['react'], d: 'Password-management application built with React.', limit: ['Security properties, such as encryption of stored credentials, have not been verified and are not claimed.'] },
  { id: 'data-importer-portal', t: 'Data Importer Portal', c: CATS[7], s: 'tbc', tech: ['react'], d: 'Web-based data-import portal built with React.', rel: ['data-importer'] },
  { id: 'image-uploader', t: 'Image Uploader (MinIO)', c: CATS[3], s: 'tbc', tech: ['aspnet-core', 'minio'], d: 'Image upload and storage app built with ASP.NET Core MVC and MinIO.' },
]

export const projById = new Map(PROJECTS.map(p => [p.id, p]))

export type Chapter = {
  id: string; n: number; stone: string; km: string; title: string; where: string
  score?: number; unit?: string; lbl?: string; dec?: number; note?: string
  bullets?: string[]; text?: string; techs?: string[]; projects?: string[]
  link?: [string, string]
}

export const CHAPTERS: Chapter[] = [
  { id: 'matric', n: 1, stone: 'Matric', km: 'KM 0', title: 'DAV Public School', where: 'Bhagalpur · March 2018 – May 2019', score: 85, unit: '%', lbl: 'Percentage' },
  { id: 'inter', n: 2, stone: 'Inter', km: 'KM 1', title: 'Chauhan Public School', where: 'Bhagalpur · Physics, Chemistry, Mathematics · March 2019 – May 2021', score: 80, unit: '%', lbl: 'Percentage' },
  { id: 'btech', n: 3, stone: 'B.Tech', km: 'KM 2', title: 'Bengal College of Engineering and Technology', where: 'Durgapur', score: 8.0, unit: '', lbl: 'CGPA', dec: 1, note: 'Discipline, dates and completion status are being verified.' },
  { id: 'job', n: 4, stone: 'Career', km: 'KM 3', title: 'Full Stack Developer', where: 'RMS Technosolution · Lucknow · August 2024 – present',
    bullets: ['Developing and maintaining web applications using ASP.NET, C# and MVC.', 'Working with SQL Server databases and CRUD operations.', 'Improving application functionality and data management.', 'Collaborating with cross-functional teams.', 'Designing and optimising backend components, including APIs.', 'Working on application performance and responsiveness.'], techs: ['csharp', 'aspnet-mvc', 'sql-server'] },
  { id: 'ent', n: 5, stone: 'Systems', km: 'KM 4', title: 'University, ERP and data-processing applications', where: 'Grouped by theme. The order of individual projects is not verified.',
    text: 'A body of university result-management, ERP, library, school and data-import applications across ASP.NET Core, MVC, Web Forms, React and WPF.',
    projects: ['result-management-lnmu', 'result-management-ddu', 'ddu-erp', 'result-search-portal', 'examiner-allotment', 'e-library', 'school-erp', 'online-test', 'data-importer', 'data-importer-portal'] },
  { id: 'cv', n: 6, stone: 'Vision', km: 'KM 5', title: 'AttendanceMaster', where: 'Computer vision and machine learning',
    text: 'Reading attendance-sheet images and recognising handwritten Copy No values with a CRNN. Nothing here is claimed as a finished product.', techs: ['python', 'opencv', 'ocr', 'crnn'], link: ['attendance', 'See the case study →'] },
  { id: 'now', n: 7, stone: 'Now', km: 'KM 6', title: 'Where the work is going', where: 'Current direction',
    text: 'Continuing CRNN training and evaluation, and building the evidence, such as held-out metrics, error analysis and experiment history, that turns a promising prototype into something measurable.' },
]

export type Zone = { id: string; name: string; x: number; y: number; desc: string; stat: string; target?: string; theme?: boolean }

export const ZONES: Zone[] = [
  { id: 'road', name: 'Journey', x: 170, y: 150, desc: 'Seven stops from school in Bhagalpur to full-stack work in Lucknow.', stat: '7 stops', target: 'road' },
  { id: 'projects', name: 'Projects', x: 480, y: 105, desc: 'Twenty projects across university systems, ERP, desktop, mobile and computer vision.', stat: '20 projects', target: 'projects' },
  { id: 'stack', name: 'Stack', x: 790, y: 150, desc: 'A graph of every technology and the projects that use it. Drag and click.', stat: '31 technologies', target: 'stack' },
  { id: 'attendance', name: 'AttendanceMaster', x: 790, y: 420, desc: 'Reading handwritten copy numbers from scanned attendance sheets. In development.', stat: 'Computer vision', target: 'attendance' },
  { id: 'night', name: 'Night switch', x: 480, y: 455, desc: 'Park here to flip the whole page between day and night.', stat: 'Theme', theme: true },
  { id: 'contact', name: 'Contact', x: 170, y: 420, desc: 'Education, certification, email and phone.', stat: 'Say hello', target: 'contact' },
]

export const OBST = [
  { x: 480, y: 280, r: 46, k: 'island' }, { x: 250, y: 215, r: 13, k: 'tree' }, { x: 640, y: 300, r: 15, k: 'tree' },
  { x: 330, y: 70, r: 12, k: 'tree' }, { x: 640, y: 60, r: 12, k: 'tree' }, { x: 80, y: 290, r: 15, k: 'tree' },
  { x: 890, y: 290, r: 15, k: 'tree' }, { x: 620, y: 490, r: 12, k: 'tree' }, { x: 330, y: 500, r: 12, k: 'tree' },
  { x: 490, y: 195, r: 7, k: 'cone' }, { x: 560, y: 180, r: 7, k: 'cone' }, { x: 660, y: 420, r: 7, k: 'cone' }, { x: 300, y: 380, r: 7, k: 'cone' },
] as { x: number; y: number; r: number; k: 'island' | 'tree' | 'cone' }[]

export const PIPE: [string, string, string][] = [
  ['Import', 'Centre folders, hashed', 'Centre folders of scans are imported automatically. Every file is hashed, so a folder that was moved, renamed or copied is recognised and not read twice. Pages are written to the database the moment any worker finishes one.'],
  ['Orient', 'Turn the page upright', "Pages are rotated upright using the table's long rules (many horizontal rules mean upright or upside-down, many vertical ones mean on its side) and header keywords found with OCR. The rotation is lossless."],
  ['Find the table', 'Columns and a row lattice', "Columns come from the vertical rules. Rows are a regular lattice fitted to the horizontal rules, so a faint rule no longer ends the table. An earlier approach chained rules from the top and silently dropped every row below the first weak one."],
  ['Cut the cells', 'One crop per Copy No', "Each row's Copy No cell is cropped, and its pixel box is stored with the row. Training crops can be cut later without detecting the table again."],
  ['Read with the CRNN', 'Model first', "The model reads every Copy No cell, one quick pass per row. A row is accepted from the model alone only when the model did not flag it, its confidence clears a threshold calibrated on held-out data for at least 99% precision, and it is 7 or 8 digits. A shadow mode can run both readers and only count how often they agree."],
  ['Fall back', 'Tesseract-based reader', "Every other row goes to a heuristic engine built on Tesseract. It classifies the layout (horizontal, tilted, two-line, compressed), straightens it, rebuilds two-line writing, and recovers missing first or last digits from strips of the cell. The model's answer is passed along as one more candidate."],
  ['Check the data', 'Against the master list', 'Sheets are printed from a master list, so the rolls on a page are a consecutive slice of it. Recognised rolls are verified against that list. A garbled roll is filled in only when exactly one student fits between verified neighbours. Centre, college and subject codes are checked too.'],
  ['People review', 'Operators and re-checkers', 'Operators verify rows against the row image. A second operator re-checks completed sheets and never gets their own work. Separate desks handle a sheet scanned twice and the same copy number fed on two rows. Every correction is logged.'],
  ['Learn', 'Corrections become training data', 'Operator-verified entries are turned into training crops and the CRNN is fine-tuned from its current best checkpoint. Training refuses to run when too few new verified samples have built up. The result feeds back into the model-first step.'],
]

export const ARCH: [string, string, string][] = [
  ['Input', '32 × W', 'A cropped, normalised strip: grayscale, fixed 32 px high, width padded to a multiple of 4.'],
  ['Conv 64', '16 × W/2', '3×3 convolutions with 64 filters, then 2×2 max-pooling. Height and width halve.'],
  ['Conv 128', '8 × W/4', '128 filters, then another 2×2 max-pooling. After this the width stops shrinking, so every four pixels of width become one time step.'],
  ['Conv 256 ×2', '4 × W/4', 'Two convolutions with batch normalisation, then pooling that halves only the height.'],
  ['Conv 512 ×2', '2 × W/4', 'Two more with batch normalisation and height-only pooling.'],
  ['Collapse', '1 × W/4', 'A 2×1 convolution squeezes the remaining height to 1. What is left is one 512-number feature per column.'],
  ['BiLSTM ×2', 'T × 512', 'Two bidirectional LSTM layers with 256 hidden units each way, so every column sees context on both sides.'],
  ['Classes', 'T × 11', 'A linear layer gives, per column, a score for the digits 0 to 9 plus a blank symbol.'],
  ['CTC decode', 'digits', 'Greedy CTC decoding collapses repeated predictions and drops blanks, so no one has to label where each digit sits. The answer is right only if every digit is.'],
]

export type Row = { n: number; roll: string; name: string; cn: string; kind: 'two' | 'flat' | 'diag' }

export const ROWS: Row[] = [
  ['259900010001', 'ASHA VERMA', '4408121', 'two'], ['259900010002', 'ROHAN SINGH', '4408122', 'flat'],
  ['259900010003', 'MEERA YADAV', '4408135', 'flat'], ['259900010004', 'KARAN MISHRA', '4408174', 'diag'],
  ['259900010005', 'POOJA PATEL', '4408141', 'flat'], ['259900010006', 'SUMIT ROY', '4408156', 'flat'],
  ['259900010007', 'NEHA GUPTA', '4408163', 'two'], ['259900010008', 'ARJUN DAS', '4408178', 'flat'],
  ['259900020001', 'KAVYA NAIR', '4408189', 'diag'], ['259900020002', 'IMRAN KHAN', '4408190', 'flat'],
  ['259900020003', 'SNEHA JOSHI', '4408201', 'flat'], ['259900020004', 'VIKASH PAL', '4408217', 'flat'],
  ['259900020005', 'TARA BOSE', '4408224', 'two'], ['259900020006', 'DEEPAK RAWAT', '4408236', 'flat'],
  ['259900020007', 'LATA SAHU', '4408248', 'flat'], ['259900020008', 'NITIN ARORA', '4408259', 'flat'],
].map(([roll, name, cn, kind], i) => ({ n: i + 1, roll, name, cn, kind }))

export const AUGS: [string, string][] = [
  ['tilt', 'Tilt'], ['bold', 'Bold ink'], ['faint', 'Faint ink'], ['squeeze', 'Squeeze'],
  ['noise', 'Noise'], ['border', 'Touching border'], ['cut', 'Cut-out'],
]

export const SD: [string, string][] = [
  ['Crop', 'Cell as cut from the sheet'], ['Ink', 'Ink separated from paper (automatic threshold)'],
  ['Layout', 'Layout found, lines joined or straightened'], ['Input', 'Model input: 32 px high, padded'],
]

export const EMAIL = 'divyanshupc@gmail.com'
export const PHONE = '+91 9142951380'
