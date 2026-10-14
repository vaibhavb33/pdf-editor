import { ToolDefinition } from "./types";

export const tools: ToolDefinition[] = [
  // 1. Merge PDF
  {
    id: "merge-pdf",
    slug: "merge-pdf",
    name: "Merge PDF",
    category: "organize",
    badge: "Popular",
    shortDescription: "Combine multiple PDF documents into a single organized file in seconds.",
    tagline: "Merge PDFs directly in your browser with zero data uploads.",
    longDescription:
      "PDFivo's client-side PDF merger allows you to seamlessly join multiple PDF documents into a single, cohesive file right inside your web browser. Because the merging engine runs entirely locally using WebAssembly and Web Workers, your confidential invoices, legal agreements, and personal records never touch external servers or cloud storage.",
    features: [
      "Merge unlimited PDF files without file size caps",
      "Reorder documents with simple drag-and-drop preview",
      "Processed locally with Web Workers for maximum speed",
      "100% private: files never touch a remote server",
    ],
    benefits: [
      {
        title: "Absolute Document Privacy",
        description:
          "Your files never leave your computer or phone. Local memory handles all document stitching, guaranteeing complete confidentiality.",
      },
      {
        title: "No Waiting or Upload Queues",
        description:
          "Traditional web converters make you wait for file uploads and server queues. PDFivo processes files immediately upon drop.",
      },
      {
        title: "Preserves Original Formatting",
        description:
          "Vector graphics, embedded fonts, annotations, and bookmarks remain perfectly intact across all combined documents.",
      },
      {
        title: "Zero Artificial File Limits",
        description:
          "Merge as many documents as your device can handle without hitting premium paywalls, account prompts, or hourly restrictions.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Select your PDF files",
        description:
          "Choose or drag and drop two or more PDF files from your device into the upload area.",
      },
      {
        stepNumber: 2,
        title: "Arrange document sequence",
        description:
          "Use the Move Up and Move Down buttons to organize your files in the exact order you want them merged.",
      },
      {
        stepNumber: 3,
        title: "Download combined PDF",
        description:
          "Click Merge PDFs to instantly assemble your unified document and save it directly to your device.",
      },
    ],
    faqs: [
      {
        question: "Are my files uploaded to your servers when merging?",
        answer:
          "No. All processing happens entirely inside your browser using client-side Web Workers and pdf-lib. Your files never leave your device.",
      },
      {
        question: "Is there a limit on how many PDFs I can merge at once?",
        answer:
          "There is no artificial limit, no signup, and no paywall. You can merge as many documents as your browser memory allows.",
      },
      {
        question: "Will the original quality or bookmarks be preserved?",
        answer:
          "Yes. PDFivo copies raw content streams directly without recompressing vector assets or rasterizing text, ensuring full fidelity.",
      },
      {
        question: "Can I merge password-protected PDF files?",
        answer:
          "You must first remove the password using our Unlock PDF tool before combining encrypted files into a new document.",
      },
      {
        question: "Does PDFivo work offline without an active internet connection?",
        answer:
          "Yes. Once the web application is loaded in your browser, all PDF manipulation happens locally without requiring active network connectivity.",
      },
    ],
    relatedSlugs: ["split-pdf", "organize-pdf", "compress-pdf", "delete-pages"],
    seo: {
      title: "Merge PDF Online Free - PDFivo",
      description:
        "Combine multiple PDF files into one in seconds. 100% private in-browser processing with zero server uploads. Merge your PDFs free now.",
      keywords: [
        "merge pdf",
        "combine pdf",
        "join pdf files",
        "free pdf merger",
        "client side pdf merge",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
  },

  // 2. Split PDF
  {
    id: "split-pdf",
    slug: "split-pdf",
    name: "Split PDF",
    category: "organize",
    shortDescription: "Extract individual pages or ranges from any PDF with client-side precision.",
    tagline: "Separate one PDF into individual pages or specific custom ranges.",
    longDescription:
      "Split oversized PDF binders, extract select chapters, or pull out single pages with pinpoint accuracy using PDFivo's browser-based PDF splitter. Whether you need a specific range like pages 3 through 7 or want every single page packaged into a convenient ZIP archive, our client-side utility delivers instant results without server delays.",
    features: [
      "Split by page ranges or extract all pages as individual files",
      "Interactive page thumbnail visualizer",
      "Instant ZIP download bundle via JSZip",
      "Zero server interaction for confidentiality",
    ],
    benefits: [
      {
        title: "Flexible Page Extraction",
        description:
          "Extract individual pages, non-contiguous intervals (such as 1, 4, 8-10), or split an entire publication into standalone sheets.",
      },
      {
        title: "Immediate ZIP Packaging",
        description:
          "Multiple split documents are automatically archived into a neat ZIP file in local browser memory for single-click downloading.",
      },
      {
        title: "Guaranteed Data Confidentiality",
        description:
          "Because splitting occurs inside your local Web Worker sandbox, sensitive legal or financial details are never transmitted over the internet.",
      },
      {
        title: "High Performance Engine",
        description:
          "Native WebAssembly-powered stream parsing extracts your pages without re-rendering or downgrading underlying page elements.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Upload PDF file",
        description:
          "Drop your PDF into the visual split area or select it using your file browser.",
      },
      {
        stepNumber: 2,
        title: "Select split mode",
        description:
          "Choose either 'Extract All Pages into ZIP' or define custom ranges (e.g., 1-3, 5) for your extraction.",
      },
      {
        stepNumber: 3,
        title: "Download extracted files",
        description:
          "Click Split PDF to generate your extracted documents and download them instantly.",
      },
    ],
    faqs: [
      {
        question: "How do I specify custom page ranges?",
        answer:
          "Enter comma-separated page numbers and hyphens for intervals, such as '1-4, 7, 9-12'. The tool automatically parses and isolates those pages.",
      },
      {
        question: "Is my confidential PDF safe from data leaks?",
        answer:
          "100% safe. The document is parsed and split strictly inside your browser's private memory sandbox without touching external servers.",
      },
      {
        question: "Can I split large documents with hundreds of pages?",
        answer:
          "Yes. Our non-blocking asynchronous architecture yields execution frames to ensure the browser never freezes during heavy document extraction.",
      },
      {
        question: "What format will my split files be downloaded in?",
        answer:
          "If multiple files or all pages are extracted, they are bundled into a convenient, uncompressed ZIP archive. Single ranges download as standard PDF.",
      },
      {
        question: "Can I extract pages from a password-locked PDF?",
        answer:
          "You must enter your password via the Unlock PDF tool first to remove security restrictions before pages can be isolated.",
      },
    ],
    relatedSlugs: ["merge-pdf", "delete-pages", "organize-pdf", "rotate-pdf"],
    seo: {
      title: "Split PDF Pages Online - PDFivo",
      description:
        "Extract specific pages or split PDF documents into separate files instantly. Completely private with zero uploads. Split your PDF today.",
      keywords: ["split pdf", "extract pdf pages", "separate pdf", "cut pdf pages", "pdf splitter"],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 3. Compress PDF
  {
    id: "compress-pdf",
    slug: "compress-pdf",
    name: "Compress PDF",
    category: "organize",
    badge: "Popular",
    shortDescription: "Reduce PDF file size while preserving high visual document fidelity.",
    tagline: "Shrink bloated PDFs in your browser without sacrificing legibility.",
    longDescription:
      "Shrink cumbersome PDF file sizes for quick email attachments, web uploads, or portal submissions using PDFivo's client-side compression tool. By re-encoding bloated embedded images, stripping out unneeded metadata, and consolidating object streams locally, PDFivo significantly reduces file weight while preserving crisp typography and clear figures.",
    features: [
      "Selectable compression modes (Extreme, Recommended, Low)",
      "Zero server uploads: processing occurs strictly client-side",
      "Instant before and after file size comparison",
      "No account needed, no email required, no watermarks",
    ],
    benefits: [
      {
        title: "Fast Email & Portal Uploads",
        description:
          "Easily reduce PDFs under strict 5MB or 10MB email attachment limits without scrambling for third-party software.",
      },
      {
        title: "Intelligent Stream Optimization",
        description:
          "Removes redundant metadata markers, consolidates duplicate font descriptors, and optimizes internal cross-reference tables.",
      },
      {
        title: "Total Document Confidentiality",
        description:
          "Because your files never leave your device, private financial statements, medical records, and tax forms remain strictly confidential.",
      },
      {
        title: "Customizable Compression Strength",
        description:
          "Tailor your output to your needs by choosing between maximum reduction for web sharing or gentle compression for archival printing.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Upload your PDF",
        description: "Drag and drop your large PDF file into the compression dropzone.",
      },
      {
        stepNumber: 2,
        title: "Choose compression profile",
        description:
          "Select your desired compression tier (Extreme, Recommended, or Low) based on your quality needs.",
      },
      {
        stepNumber: 3,
        title: "Download smaller PDF",
        description:
          "Click Compress PDF to optimize your document and view your saved storage space before downloading.",
      },
    ],
    faqs: [
      {
        question: "How does client-side PDF compression work?",
        answer:
          "PDFivo re-encodes embedded image streams, strips unnecessary metadata objects, and optimizes cross-reference tables directly within browser memory.",
      },
      {
        question: "Will text become blurry after compression?",
        answer:
          "No. Vector text glyphs and font outlines are resolution-independent and remain razor-sharp regardless of the chosen compression level.",
      },
      {
        question: "Are my files uploaded to any third-party server?",
        answer:
          "Never. All compression calculations run client-side on your local processor via WebAssembly and Web Workers.",
      },
      {
        question: "Which compression level should I choose?",
        answer:
          "Recommended is optimal for the vast majority of documents. Choose Extreme when facing strict upload caps, or Low if preserving print quality.",
      },
      {
        question: "Why did my PDF only shrink by a small percentage?",
        answer:
          "PDFs containing only pure vector text or already-optimized graphics have very little redundant data to remove without degrading contents.",
      },
    ],
    relatedSlugs: ["merge-pdf", "pdf-to-jpg", "split-pdf", "delete-pages"],
    seo: {
      title: "Compress PDF Online Free - PDFivo",
      description:
        "Reduce PDF file size quickly without losing visual quality. Runs 100% client-side with no signups. Compress your PDF documents now.",
      keywords: [
        "compress pdf",
        "reduce pdf size",
        "shrink pdf",
        "make pdf smaller",
        "online pdf compressor",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 4. Rotate PDF
  {
    id: "rotate-pdf",
    slug: "rotate-pdf",
    name: "Rotate PDF",
    category: "organize",
    shortDescription:
      "Rotate individual or all PDF pages permanently clockwise or counterclockwise.",
    tagline: "Fix upside-down or sideways PDF scans permanently in seconds.",
    longDescription:
      "Tired of opening documents with inverted orientations or sideways scans? PDFivo's visual Rotate PDF tool lets you fix page orientations with permanent precision. Rotate individual problem pages or the entire document by 90, 180, or 270 degrees with live thumbnail previews, ensuring your file opens correctly in every PDF viewer and printer.",
    features: [
      "Rotate individual pages or all pages at once",
      "90°, 180°, and 270° orientation corrections",
      "Interactive visual page orientation preview",
      "Processed locally with instantaneous saving",
    ],
    benefits: [
      {
        title: "Permanent Metadata Correction",
        description:
          "Unlike viewers that only rotate your view temporarily, PDFivo permanently updates the document's rotation metadata.",
      },
      {
        title: "Selective Page Rotation",
        description:
          "Correct landscape chart pages inside a portrait document without flipping the rest of your presentation.",
      },
      {
        title: "Instant Live Visual Previews",
        description:
          "Inspect every thumbnail before saving so you know exactly how each page will display when printed or shared.",
      },
      {
        title: "Zero Cloud Dependencies",
        description:
          "Rotation occurs instantly in your browser memory, eliminating the risk of transmitting confidential records.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Open your PDF",
        description:
          "Drop your PDF file into the visual page layout workspace to view all page thumbnails.",
      },
      {
        stepNumber: 2,
        title: "Rotate pages as needed",
        description:
          "Click rotation icons on individual pages or use the global rotate buttons to turn all pages at once.",
      },
      {
        stepNumber: 3,
        title: "Save rotated document",
        description:
          "Click Apply Rotation to generate and download your permanently re-oriented PDF file.",
      },
    ],
    faqs: [
      {
        question: "Is the rotation permanent across all devices?",
        answer:
          "Yes. PDFivo alters the PDF's internal rotation tag, ensuring the file opens in the correct orientation in Adobe Acrobat, mobile devices, and printers.",
      },
      {
        question: "Can I rotate just one sideways page in a large book?",
        answer:
          "Yes. You can rotate individual pages independently without changing the orientation of any other pages.",
      },
      {
        question: "Will rotating pages decrease image or text quality?",
        answer:
          "No. Rotation is a pure metadata adjustment; page content streams and vector drawings are not altered or re-compressed.",
      },
      {
        question: "How many pages can I rotate simultaneously?",
        answer:
          "You can rotate documents of any size. Our thumbnail virtualizer ensures smooth scrolling even on large documents.",
      },
      {
        question: "Are my files uploaded anywhere during rotation?",
        answer:
          "Never. All thumbnail generation and metadata updates happen entirely within local browser memory.",
      },
    ],
    relatedSlugs: ["organize-pdf", "delete-pages", "split-pdf", "merge-pdf"],
    seo: {
      title: "Rotate PDF Pages Permanently - PDFivo",
      description:
        "Rotate individual pages or your entire PDF document permanently in your browser. Fast, private, and free. Rotate your PDF pages now.",
      keywords: [
        "rotate pdf",
        "turn pdf",
        "rotate pdf pages",
        "flip pdf permanently",
        "fix upside down pdf",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 5. Delete Pages
  {
    id: "delete-pages",
    slug: "delete-pages",
    name: "Delete Pages",
    category: "organize",
    shortDescription: "Remove unwanted pages from any PDF document and export a clean file.",
    tagline: "Purge blank, redundant, or sensitive pages from your PDF in seconds.",
    longDescription:
      "Clean up your PDF documents by removing unwanted pages, blank sheets, accidental duplicates, or outdated slides. PDFivo provides an interactive thumbnail grid where you can simply click to mark pages for removal. The remaining pages are seamlessly compiled into a fresh, streamlined PDF document without any server involvement.",
    features: [
      "Visual page selector with interactive deletion markers",
      "Remove single pages or bulk page ranges",
      "Real-time page count and remaining document summary",
      "Zero server uploads: fast and 100% private",
    ],
    benefits: [
      {
        title: "Effortless Visual Selection",
        description:
          "Identify unnecessary pages at a glance using high-resolution thumbnails instead of guessing page numbers.",
      },
      {
        title: "Clean Document Restructuring",
        description:
          "The output file is cleanly reassembled with updated page indices and internal references, leaving zero orphaned elements.",
      },
      {
        title: "Complete Data Confidentiality",
        description:
          "Deleted pages are purged permanently from browser memory without ever touching an external server or cloud log.",
      },
      {
        title: "Fast, Unrestricted Processing",
        description:
          "Delete pages from files of any size without registration, credits, or artificial daily limits.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Upload your document",
        description:
          "Drop your PDF file into the deletion workspace to render thumbnail views of every page.",
      },
      {
        stepNumber: 2,
        title: "Select pages to delete",
        description:
          "Click on any thumbnail to mark that page for removal. Marked pages will be clearly highlighted in red.",
      },
      {
        stepNumber: 3,
        title: "Download clean PDF",
        description:
          "Click Remove Pages to export your updated document with all selected pages stripped out.",
      },
    ],
    faqs: [
      {
        question: "Can I undo a page deletion before exporting?",
        answer:
          "Yes. Simply click the thumbnail again to unmark it before clicking the export button.",
      },
      {
        question: "Can I delete all pages from a PDF?",
        answer:
          "A valid PDF document must contain at least one page. The tool requires at least one page to remain in the final export.",
      },
      {
        question: "Are deleted pages permanently erased?",
        answer:
          "Yes. The newly downloaded PDF contains only the retained pages, completely omitting the data from deleted pages.",
      },
      {
        question: "Does deleting pages recompress or damage the remaining content?",
        answer:
          "No. The retained pages are copied bit-for-bit from the original document, preserving exact typography and graphic quality.",
      },
      {
        question: "Is there any risk of sensitive pages leaking?",
        answer:
          "Zero risk. The entire process runs locally in your web browser. No pages or document streams are ever sent across the web.",
      },
    ],
    relatedSlugs: ["organize-pdf", "split-pdf", "rotate-pdf", "merge-pdf"],
    seo: {
      title: "Delete PDF Pages Online - PDFivo",
      description:
        "Remove unwanted pages from any PDF file with visual thumbnail preview. Files never leave your browser. Delete your PDF pages now.",
      keywords: [
        "delete pdf pages",
        "remove pages from pdf",
        "strip pdf pages",
        "delete pages online",
        "clean pdf",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 6. Organize / Reorder PDF
  {
    id: "organize-pdf",
    slug: "organize-pdf",
    name: "Organize PDF",
    category: "organize",
    shortDescription: "Reorder, duplicate, and sort PDF pages with intuitive visual drag-and-drop.",
    tagline: "Rearrange your PDF pages into the perfect sequence in your browser.",
    longDescription:
      "Take complete control of your document layout with PDFivo's visual page organizer. Whether you are assembling reports, rearranging presentation slide decks, or sorting scanned invoices, our drag-and-drop thumbnail interface makes re-sequencing intuitive, effortless, and instantaneous. Everything runs locally in browser memory for absolute privacy.",
    features: [
      "Drag-and-drop visual page reordering",
      "Move Left / Move Right directional controls",
      "Instant page duplication and quick deletion",
      "Zero server interaction: files stay on your machine",
    ],
    benefits: [
      {
        title: "Intuitive Visual Layout",
        description:
          "Inspect every slide, sheet, or invoice thumbnail as you drag pages into the exact order you need.",
      },
      {
        title: "All-in-One Page Management",
        description:
          "Reorder, duplicate important reference pages, and delete unwanted sheets in a single, fluid visual session.",
      },
      {
        title: "Zero-Knowledge Local Safety",
        description:
          "Reordering calculations run client-side in browser memory, ensuring confidential presentations remain private.",
      },
      {
        title: "Lossless Stream Assembly",
        description:
          "PDFivo re-indexes pages without modifying underlying vector graphics or recompressing embedded photos.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Load your PDF",
        description:
          "Drop your PDF into the visual page organizer to generate thumbnail previews for each sheet.",
      },
      {
        stepNumber: 2,
        title: "Drag and arrange pages",
        description:
          "Drag thumbnails into your desired sequence or use the Move Left and Move Right buttons.",
      },
      {
        stepNumber: 3,
        title: "Save reordered PDF",
        description:
          "Click Save Organization to export and download your freshly arranged PDF document.",
      },
    ],
    faqs: [
      {
        question: "Can I duplicate a page while organizing?",
        answer:
          "Yes. You can duplicate any page in the organizer to repeat key forms, covers, or reference tables throughout the file.",
      },
      {
        question: "Will reorganizing pages break hyperlinks inside the document?",
        answer:
          "Internal page links pointing to specific target pages will adapt to the newly exported structure accurately.",
      },
      {
        question: "Does the organizer work on touchscreens and tablets?",
        answer:
          "Yes. Our visual organizer fully supports touch drag-and-drop gestures as well as directional step buttons.",
      },
      {
        question: "Is there a limit on how many pages I can sort?",
        answer:
          "No artificial caps exist. PDFivo leverages client-side Web Workers to maintain fluid performance across large binders.",
      },
      {
        question: "Are my documents saved or cached on any server?",
        answer:
          "No. All files exist only in your browser's temporary memory and vanish the moment you close or refresh the tab.",
      },
    ],
    relatedSlugs: ["delete-pages", "rotate-pdf", "split-pdf", "merge-pdf"],
    seo: {
      title: "Organize PDF Pages Online - PDFivo",
      description:
        "Reorder, rearrange, and sort PDF pages with intuitive drag-and-drop thumbnails. Completely private and free. Organize your PDF today.",
      keywords: [
        "organize pdf",
        "reorder pdf pages",
        "rearrange pdf",
        "sort pdf pages",
        "drag and drop pdf pages",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 7. PDF to JPG/PNG
  {
    id: "pdf-to-jpg",
    slug: "pdf-to-jpg",
    name: "PDF to JPG/PNG",
    category: "convert",
    badge: "Popular",
    shortDescription:
      "Convert PDF pages to crystal-clear JPG or PNG images directly in your browser.",
    tagline: "Extract high-resolution images from every PDF page with zero uploads.",
    longDescription:
      "Turn your PDF document into crisp, high-resolution JPG or PNG images with PDFivo's client-side rasterizer. Powered by the pdfjs-dist rendering engine running on an isolated Web Worker, every page is rendered to high-DPI canvas pixels without sending a single byte across the internet. Download individual sheets or receive the entire document packaged in a convenient ZIP file.",
    features: [
      "Selectable image format: JPG or lossless PNG",
      "Adjustable rendering resolution scale (1x, 2x, 3x DPI)",
      "Automated ZIP archiving for multi-page extractions",
      "Completely private: runs 100% in local browser memory",
    ],
    benefits: [
      {
        title: "High-DPI Razor Sharp Renders",
        description:
          "Choose 2x or 3x retina scaling to ensure vector lines, small text, and diagrams remain crystal clear in the output images.",
      },
      {
        title: "Instant Offline Processing",
        description:
          "Rendering uses your local GPU and canvas capabilities, meaning conversion starts instantaneously with zero upload lag.",
      },
      {
        title: "Flexible Format Selection",
        description:
          "Pick lightweight JPG for quick social sharing or uncompressed PNG for graphics requiring crisp line art.",
      },
      {
        title: "Zero Exposure of Private Data",
        description:
          "Confidential blueprints, identity documents, and sensitive contracts are converted without touching remote cloud servers.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Upload your PDF",
        description: "Drop your PDF file into the image conversion dropzone to begin.",
      },
      {
        stepNumber: 2,
        title: "Configure resolution & format",
        description:
          "Select whether you want JPG or PNG output, and choose your preferred resolution scale.",
      },
      {
        stepNumber: 3,
        title: "Download image ZIP",
        description:
          "Click Convert to Images to render all pages and download them in a convenient ZIP file.",
      },
    ],
    faqs: [
      {
        question: "What is the difference between JPG and PNG export?",
        answer:
          "PNG produces lossless images ideal for diagrams and sharp text. JPG produces smaller file sizes ideal for photographs and general sharing.",
      },
      {
        question: "Can I choose the resolution or DPI of the output images?",
        answer:
          "Yes. You can select standard 1x, high-resolution 2x, or ultra-crisp 3x rendering scales for print-quality image fidelity.",
      },
      {
        question: "How are multi-page documents delivered?",
        answer:
          "All rendered pages are automatically bundled into an organized, uncompressed ZIP archive for convenient single-click downloading.",
      },
      {
        question: "Will my PDF files ever be uploaded to an image server?",
        answer:
          "Never. Rasterization is performed directly on an HTML5 canvas inside your local browser using a dedicated Web Worker.",
      },
      {
        question: "Does this tool work on scanned PDF documents?",
        answer:
          "Yes. Scanned PDF pages are accurately converted into high-resolution JPG or PNG images matching the original scan quality.",
      },
    ],
    relatedSlugs: ["jpg-to-pdf", "compress-pdf", "edit-pdf", "split-pdf"],
    seo: {
      title: "Convert PDF to JPG Online - PDFivo",
      description:
        "Convert PDF pages to high-resolution JPG or PNG images and download as a ZIP. Private in-browser tool. Convert your PDF to images now.",
      keywords: [
        "pdf to jpg",
        "pdf to png",
        "convert pdf to image",
        "pdf to jpeg",
        "extract images from pdf",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 8. JPG/PNG to PDF
  {
    id: "jpg-to-pdf",
    slug: "jpg-to-pdf",
    name: "JPG/PNG to PDF",
    category: "convert",
    shortDescription: "Transform photos and graphic images into a polished, unified PDF file.",
    tagline: "Combine multiple JPG and PNG images into a clean PDF document.",
    longDescription:
      "Convert photos, screenshots, receipts, and graphic designs into a standardized, shareable PDF document with PDFivo. Upload multiple images at once, customize page sizing, configure margins, and reorder files with ease. Because all image embedding executes directly in your browser, your personal photographs and confidential receipts remain 100% private.",
    features: [
      "Supports JPG, PNG, and WebP image formats",
      "Custom page sizing: Fit Image, Standard A4, or US Letter",
      "Reorder images prior to document compilation",
      "High-speed client-side embedding with zero data uploads",
    ],
    benefits: [
      {
        title: "Universal Page Layouts",
        description:
          "Choose whether each page matches the exact dimensions of the image or standardizes onto formal A4 or US Letter sheets.",
      },
      {
        title: "Clean Document Sequencing",
        description:
          "Easily rearrange photos using the order controls to ensure pages flow logically from cover to conclusion.",
      },
      {
        title: "High-Fidelity Embedding",
        description:
          "Raw image pixels are embedded without lossy re-quantization, keeping your photos crisp and vibrant.",
      },
      {
        title: "Uncompromising Privacy",
        description:
          "Personal identity photos, driver licenses, and receipts stay on your device without transmitting over the network.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Select your images",
        description: "Choose or drag and drop JPG, PNG, or WebP images into the upload workspace.",
      },
      {
        stepNumber: 2,
        title: "Arrange order & page size",
        description:
          "Set your target page dimensions (Fit, A4, or Letter) and arrange the sequence of your sheets.",
      },
      {
        stepNumber: 3,
        title: "Download unified PDF",
        description:
          "Click Convert to PDF to generate and download your newly compiled multi-page PDF document.",
      },
    ],
    faqs: [
      {
        question: "Can I combine multiple different image formats into one PDF?",
        answer:
          "Yes. You can upload a mix of JPG and PNG files simultaneously and PDFivo will compile them into a seamless document.",
      },
      {
        question: "Will the images lose quality when converted to PDF?",
        answer:
          "No. Original image streams are embedded into the PDF structure at their native resolution without unwanted downsampling.",
      },
      {
        question: "How do I choose between 'Fit Image' and 'A4' page size?",
        answer:
          "'Fit Image' creates a page that matches your photo's exact dimensions. 'A4' creates standard document sheets with clean borders.",
      },
      {
        question: "Is there a limit on how many images I can convert?",
        answer:
          "There is no artificial limit. You can compile dozens of receipts, slides, or photos into a single PDF file.",
      },
      {
        question: "Are my photos uploaded to any server or cloud database?",
        answer:
          "Never. Image loading and PDF generation run entirely in client-side JavaScript within your local browser.",
      },
    ],
    relatedSlugs: ["pdf-to-jpg", "merge-pdf", "compress-pdf", "organize-pdf"],
    seo: {
      title: "Convert JPG to PDF Online - PDFivo",
      description:
        "Turn JPG and PNG images into a clean PDF document with custom margins and sizing. No upload needed. Convert your images to PDF now.",
      keywords: [
        "jpg to pdf",
        "png to pdf",
        "images to pdf",
        "convert photos to pdf",
        "picture to pdf converter",
      ],
    },
    acceptedFileTypes: [".jpg", ".jpeg", ".png", ".webp", "image/*"],
  },

  // 9. Add Watermark
  {
    id: "watermark-pdf",
    slug: "watermark-pdf",
    name: "Add Watermark",
    category: "edit",
    shortDescription:
      "Stamp text or image watermarks across your PDF pages with custom opacity and angle.",
    tagline: "Protect your intellectual property with customizable PDF watermarks.",
    longDescription:
      "Protect your drafts, confidential reports, and legal exhibits from unauthorized distribution by adding custom watermarks with PDFivo. Add bold notices like 'CONFIDENTIAL', 'DRAFT', or 'COPY' across every page, or customize the font size, opacity, rotation angle, and color to match your organization's exact branding requirements. All stamping runs locally on your device.",
    features: [
      "Custom text watermarks with real-time text styling",
      "Adjustable opacity slider (10% to 100%) and rotation angle",
      "Custom color picker for bold or subtle stamps",
      "Zero server interaction: files stay completely private",
    ],
    benefits: [
      {
        title: "Customizable Transparency",
        description:
          "Fine-tune opacity so the watermark clearly deters misuse while allowing underlying text to remain easily legible.",
      },
      {
        title: "Precise Angle & Orientation",
        description:
          "Stamp classic 45-degree diagonal notices, horizontal badges, or vertical security margins across all sheets.",
      },
      {
        title: "Immediate Universal Application",
        description:
          "Watermarks are stamped across all pages in a single automated pass without manual repetitive positioning.",
      },
      {
        title: "Private Document Handling",
        description:
          "Confidential contracts and embargoed press releases are watermarked locally without risk of leaks.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Upload your PDF",
        description: "Drop your PDF document into the watermark customization workspace.",
      },
      {
        stepNumber: 2,
        title: "Configure watermark text & style",
        description:
          "Type your text, adjust the font size, select a color, and set the desired opacity and rotation angle.",
      },
      {
        stepNumber: 3,
        title: "Download watermarked PDF",
        description:
          "Click Add Watermark to stamp every page and download your secured PDF document.",
      },
    ],
    faqs: [
      {
        question: "Can I adjust the transparency of the watermark?",
        answer:
          "Yes. The opacity slider allows you to dial in the exact transparency level from 10% (subtle background) to 100% (solid overlay).",
      },
      {
        question: "Can someone easily erase or remove the watermark?",
        answer:
          "The watermark is merged directly into the vector page content stream, making casual removal with basic viewers impossible.",
      },
      {
        question: "Will adding a watermark affect the original document formatting?",
        answer:
          "No. Watermarks are layered onto existing pages without shifting text layout, margins, or embedded graphic positions.",
      },
      {
        question: "Can I change the angle to diagonal across the page?",
        answer:
          "Yes. You can specify any angle, including the popular 45-degree diagonal stamp across the center of each page.",
      },
      {
        question: "Are my confidential files uploaded when adding a watermark?",
        answer:
          "Never. All vector stamping executes locally within your browser using client-side JavaScript.",
      },
    ],
    relatedSlugs: ["page-numbers-pdf", "edit-pdf", "protect-pdf", "sign-pdf"],
    seo: {
      title: "Watermark PDF Online Free - PDFivo",
      description:
        "Stamp custom text or image watermarks onto PDF pages with adjustable opacity and rotation. 100% private. Watermark your PDF online now.",
      keywords: [
        "watermark pdf",
        "add watermark to pdf",
        "stamp pdf",
        "confidential watermark",
        "free pdf watermark",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 10. Add Page Numbers
  {
    id: "page-numbers-pdf",
    slug: "page-numbers-pdf",
    name: "Add Page Numbers",
    category: "edit",
    shortDescription:
      "Insert custom page numbers, Roman numerals, and numbering styles onto any PDF.",
    tagline: "Number your PDF pages with professional formatting and flexible placement.",
    longDescription:
      "Prepare manuscripts, briefs, reports, and documentation for formal presentation with PDFivo's client-side page numbering tool. Choose from customizable templates such as 'Page {n} of {total}' or simple numbers, select your preferred corner or margin placement, adjust typography size, and set start numbers. Everything is applied locally with zero document exposure.",
    features: [
      "Custom numbering templates ('Page {n} of {total}', '{n}', '{n}/{total}')",
      "6 placement positions (Bottom Center, Bottom Right, Top Right, etc.)",
      "Adjustable starting page number and typography sizing",
      "Processed locally with immediate client-side export",
    ],
    benefits: [
      {
        title: "Standardized Formatting",
        description:
          "Give scattered scans, merged packets, and compiled drafts a polished, cohesive presentation with continuous page numbers.",
      },
      {
        title: "Flexible Anchor Positions",
        description:
          "Anchor numbers to bottom-center for academic papers, bottom-right for reports, or headers for corporate filings.",
      },
      {
        title: "Customizable Start Counters",
        description:
          "Start numbering from any integer, making it simple to accommodate separate cover pages and appendices.",
      },
      {
        title: "Zero Cloud Security Risks",
        description:
          "Your documents are parsed and numbered inside your browser, keeping sensitive client briefs completely private.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Select your PDF",
        description: "Drop your PDF file into the page numbering workspace.",
      },
      {
        stepNumber: 2,
        title: "Choose position & numbering format",
        description:
          "Pick your preferred placement (e.g., Bottom Center) and format style (e.g., Page {n} of {total}).",
      },
      {
        stepNumber: 3,
        title: "Download numbered PDF",
        description:
          "Click Add Page Numbers to calculate and apply all page labels and download your updated file.",
      },
    ],
    faqs: [
      {
        question: "Can I use 'Page 1 of 20' formatting?",
        answer:
          "Yes. Our format template supports dynamic tags like '{n}' for the current page and '{total}' for the total page count.",
      },
      {
        question: "Can I start numbering from page 2 to skip the cover?",
        answer:
          "Yes. You can specify a custom start number or configure page offsets to preserve clean unnumbered cover sheets.",
      },
      {
        question: "Where can I place page numbers on the page?",
        answer:
          "You can place numbers in 6 key positions: Bottom-Center, Bottom-Right, Bottom-Left, Top-Center, Top-Right, or Top-Left.",
      },
      {
        question: "Will numbering overwrite existing footer text?",
        answer:
          "Numbers are drawn cleanly over the page canvas. You can adjust the margin slider to position numbers away from existing content.",
      },
      {
        question: "Are files uploaded to a remote server for numbering?",
        answer:
          "Never. All font embedding and text rendering occur inside your browser using client-side Web Workers.",
      },
    ],
    relatedSlugs: ["watermark-pdf", "edit-pdf", "merge-pdf", "organize-pdf"],
    seo: {
      title: "Add Page Numbers to PDF - PDFivo",
      description:
        "Insert custom page numbers, Roman numerals, and numbering styles to your PDF. Clean, private, and free. Number your PDF pages today.",
      keywords: [
        "add page numbers to pdf",
        "number pdf pages",
        "pdf pagination",
        "page number tool",
        "bates numbering",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 11. Sign PDF
  {
    id: "sign-pdf",
    slug: "sign-pdf",
    name: "Sign PDF",
    category: "edit",
    badge: "Popular",
    shortDescription:
      "Draw, type, or upload your electronic signature to sign PDF contracts and forms.",
    tagline: "Sign PDF contracts, agreements, and forms in your browser with zero uploads.",
    longDescription:
      "Execute agreements, approve invoices, and sign legal forms with PDFivo's client-side electronic signature studio. Create your signature by drawing on a responsive canvas, typing your name with elegant cursive calligraphy, or uploading an existing transparent signature graphic. Position your signature on any page with exact coordinate controls without ever exposing sensitive contracts to cloud servers.",
    features: [
      "3 signature methods: Draw on canvas, Type with cursive font, or Upload image",
      "Target page selector with exact point positioning",
      "High-contrast, smooth stroke rendering for authentic signatures",
      "100% private: contracts and agreements never leave your browser",
    ],
    benefits: [
      {
        title: "Multi-Modal Signature Studio",
        description:
          "Choose the signing style that best suits your setup: touch/mouse drawing, styled font typing, or transparent PNG upload.",
      },
      {
        title: "Exact Visual Placement",
        description:
          "Place your signature on the exact signature line of any target page with adjustable sizing and positions.",
      },
      {
        title: "Guaranteed Legal Privacy",
        description:
          "Non-disclosure agreements, contracts, and employment forms never leave your local browser sandbox.",
      },
      {
        title: "Zero Subscriptions or Accounts",
        description:
          "Avoid expensive monthly e-signature subscriptions. Sign your everyday documents completely free and unlimited.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Upload your document",
        description: "Drop your PDF agreement or form into the signature workspace.",
      },
      {
        stepNumber: 2,
        title: "Create your signature",
        description:
          "Draw your signature with mouse/touch, type your name in cursive, or upload a signature image.",
      },
      {
        stepNumber: 3,
        title: "Place and download signed PDF",
        description:
          "Choose your target page and click Sign & Export to download your completed, signed document.",
      },
    ],
    faqs: [
      {
        question: "Is this electronic signature legally binding?",
        answer:
          "Under the US ESIGN Act and EU eIDAS regulations, electronic signatures placed on agreements with intent to sign are generally legally recognized.",
      },
      {
        question: "Can I sign using a smartphone or tablet screen?",
        answer:
          "Yes. The drawing canvas supports smooth touch and stylus input on mobile phones, iPads, and touch-screen laptops.",
      },
      {
        question: "Are my signature or contracts stored on your servers?",
        answer:
          "Never. PDFivo does not possess servers for file processing. All signatures and documents exist purely in your browser memory.",
      },
      {
        question: "Can I use a pre-existing transparent signature image?",
        answer:
          "Yes. You can upload any transparent PNG or JPEG signature graphic and PDFivo will cleanly embed it into your document.",
      },
      {
        question: "Can I sign multiple pages in the same PDF?",
        answer:
          "Yes. You can add signature placements across any page number in the document before exporting the final signed file.",
      },
    ],
    relatedSlugs: ["edit-pdf", "protect-pdf", "watermark-pdf", "merge-pdf"],
    seo: {
      title: "Sign PDF Online Free - PDFivo",
      description:
        "Draw, type, or upload your electronic signature to sign PDF contracts and forms securely. 100% private. Sign your PDF document now.",
      keywords: [
        "sign pdf",
        "electronic signature pdf",
        "sign pdf online",
        "e-sign pdf free",
        "fill and sign pdf",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 12. Protect PDF
  {
    id: "protect-pdf",
    slug: "protect-pdf",
    name: "Protect PDF",
    category: "secure",
    shortDescription: "Encrypt and lock your PDF document with password security client-side.",
    tagline: "Lock sensitive PDF documents with secure password protection.",
    longDescription:
      "Prevent unauthorized viewing, copying, or printing of your sensitive documents with PDFivo's client-side PDF protection tool. Encrypt your documents with robust password security directly in your browser. Because the encryption happens locally without transmitting your password or document to remote servers, you maintain complete custody over your security credentials.",
    features: [
      "Client-side PDF security encryption",
      "Password confirmation check with visual visibility toggle",
      "Restricts unauthorized viewing and content extraction",
      "Zero server uploads: passwords and data never leave your device",
    ],
    benefits: [
      {
        title: "Zero Credential Transmission",
        description:
          "Your password is never sent across the internet, protecting you from interception, network sniffing, and cloud credential breaches.",
      },
      {
        title: "Standard Universal Encryption",
        description:
          "Protected files adhere to standard PDF specification security, prompting for the password in Adobe Acrobat, browsers, and mobile readers.",
      },
      {
        title: "Confidentiality for Sensitive Records",
        description:
          "Safeguard financial audits, client tax returns, health records, and proprietary formulas before distributing them.",
      },
      {
        title: "Instant In-Browser Execution",
        description:
          "Encrypt files in milliseconds without waiting for server uploads or dealing with email links.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Upload your PDF",
        description: "Drop your PDF file into the password protection workspace.",
      },
      {
        stepNumber: 2,
        title: "Set and confirm your password",
        description:
          "Enter a strong password and re-enter it to verify that both fields match perfectly.",
      },
      {
        stepNumber: 3,
        title: "Download encrypted PDF",
        description:
          "Click Protect PDF to encrypt your document and download your password-locked file.",
      },
    ],
    faqs: [
      {
        question: "Can anyone open the PDF without the password?",
        answer:
          "No. Standard PDF viewers will require the recipient to enter the exact password before unlocking the document content.",
      },
      {
        question: "Do you store or log my password on your server?",
        answer:
          "Never. PDFivo has no database or backend servers. The encryption is executed entirely in your local browser.",
      },
      {
        question: "What happens if I forget the password I set?",
        answer:
          "Because encryption runs client-side with zero backdoors, nobody can recover your password if you lose it. Always keep a secure backup.",
      },
      {
        question: "Will the protected PDF work on mobile devices?",
        answer:
          "Yes. Password-protected PDFs are standard files that open seamlessly on iOS, Android, macOS, Windows, and Linux.",
      },
      {
        question: "How can I remove the password later?",
        answer: "You can remove the password at any time by entering it into our Unlock PDF tool.",
      },
    ],
    relatedSlugs: ["unlock-pdf", "watermark-pdf", "sign-pdf", "compress-pdf"],
    seo: {
      title: "Protect PDF with Password - PDFivo",
      description:
        "Encrypt your sensitive PDF files with secure password protection right in your browser. No files uploaded. Secure your PDF now.",
      keywords: [
        "protect pdf",
        "password protect pdf",
        "encrypt pdf",
        "lock pdf",
        "secure pdf file",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 13. Unlock PDF
  {
    id: "unlock-pdf",
    slug: "unlock-pdf",
    name: "Unlock PDF",
    category: "secure",
    shortDescription:
      "Remove password security and restrictions from your PDF when the password is known.",
    tagline: "Remove password security to freely view, edit, and share your PDF files.",
    longDescription:
      "Tired of repeatedly typing passwords into your bank statements, payslips, or recurring utility bills? PDFivo's Unlock PDF tool lets you enter the known password once and export an unrestricted, permanently decrypted version. Because decryption happens entirely client-side, your confidential password and document contents remain completely secure.",
    features: [
      "Permanently decrypts password-protected PDF files",
      "Removes printing, copying, and editing restrictions",
      "Instant client-side decryption in browser memory",
      "100% private: files and passwords never touch a server",
    ],
    benefits: [
      {
        title: "Permanent Decryption Convenience",
        description:
          "Open, view, and print your recurring statements without being prompted for password credentials every single time.",
      },
      {
        title: "Remove Functional Restrictions",
        description:
          "Unlock permissions on documents that prevent you from copying text, printing, or extracting pages.",
      },
      {
        title: "Secure Local Processing",
        description:
          "Decryption takes place inside your browser sandbox, keeping your financial statements and passwords strictly private.",
      },
      {
        title: "Instant Free Unlocking",
        description:
          "No signup, no waitlists, and no paywalls. Unlock your documents whenever you need them.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Upload your locked PDF",
        description: "Drop your password-protected PDF file into the unlock workspace.",
      },
      {
        stepNumber: 2,
        title: "Enter current password",
        description: "Type the known password used to encrypt the document in the security field.",
      },
      {
        stepNumber: 3,
        title: "Download unlocked PDF",
        description:
          "Click Unlock PDF to strip encryption and download your open, restriction-free document.",
      },
    ],
    faqs: [
      {
        question: "Can this tool crack or bypass passwords I do not know?",
        answer:
          "No. PDFivo is a privacy-first utility for legitimate document owners. You must know the password to decrypt the file.",
      },
      {
        question: "Is it safe to type my confidential password here?",
        answer:
          "Yes. Decryption executes entirely client-side in your local browser memory. Your password is never transmitted across the network.",
      },
      {
        question: "Will the unlocked PDF open without a password on all devices?",
        answer:
          "Yes. The exported document is completely unencrypted and can be opened freely on any viewer, device, or printer.",
      },
      {
        question: "Does unlocking alter the contents of the document?",
        answer:
          "No. All text, layout formatting, vector drawings, and embedded images remain exactly as they were in the original file.",
      },
      {
        question: "Can I re-encrypt the file later if needed?",
        answer:
          "Yes. You can easily re-apply password protection at any time using our Protect PDF tool.",
      },
    ],
    relatedSlugs: ["protect-pdf", "compress-pdf", "merge-pdf", "edit-pdf"],
    seo: {
      title: "Unlock PDF Online Free - PDFivo",
      description:
        "Remove password security and restrictions from your PDF when the password is known. Fast and private. Unlock your PDF file now.",
      keywords: [
        "unlock pdf",
        "remove password from pdf",
        "decrypt pdf",
        "unprotect pdf",
        "pdf password remover",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },

  // 14. Basic PDF Editor
  {
    id: "edit-pdf",
    slug: "edit-pdf",
    name: "Edit PDF",
    category: "edit",
    badge: "Popular",
    shortDescription:
      "Add text, draw shapes, highlight passages, and insert images directly onto PDF pages.",
    tagline: "Annotate, mark up, and edit PDF pages in your browser without watermarks.",
    longDescription:
      "Annotate documents, fill out forms, add vector callouts, and insert stamp images with PDFivo's client-side basic PDF editor. Whether you need to type notes into non-interactive fields, highlight crucial sentences in study materials, or place diagram callouts, our in-browser annotation suite executes cleanly in local memory without subscriptions or watermarks.",
    features: [
      "Add custom text blocks with configurable font sizes",
      "Semi-transparent highlighter overlays for text review",
      "Vector shapes: draw rectangles and focus borders",
      "Insert image stamps (PNG, JPG) onto any page",
      "Zero server uploads: all annotations apply client-side",
    ],
    benefits: [
      {
        title: "All-In-One Annotation Suite",
        description:
          "Equipped with text placement, highlighter rectangles, vector framing boxes, and custom image insertion tools.",
      },
      {
        title: "Zero Watermarks or Paywalls",
        description:
          "Unlike commercial editors that deface your documents with trial watermarks, PDFivo exports clean, professional files.",
      },
      {
        title: "Multi-Page Selective Targeting",
        description:
          "Add annotations to specific sheets throughout your document and manage all pending elements before exporting.",
      },
      {
        title: "Strict Zero-Knowledge Safety",
        description:
          "Edit non-disclosure contracts, tax forms, and medical papers with confidence knowing data never leaves your browser.",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Upload your document",
        description: "Drop your PDF file into the basic editor workspace.",
      },
      {
        stepNumber: 2,
        title: "Add text, highlights, or shapes",
        description:
          "Choose your tool (Text, Highlight, Rectangle, or Image), configure settings, and click Add to Document.",
      },
      {
        stepNumber: 3,
        title: "Apply and download edited PDF",
        description:
          "Review your pending items and click Apply All & Export PDF to download your marked-up document.",
      },
    ],
    faqs: [
      {
        question: "Can I highlight existing text in the PDF?",
        answer:
          "Yes. The Highlight tool draws semi-transparent marker rectangles over text sections to emphasize key clauses and figures.",
      },
      {
        question: "Will the editor add a watermark to my output PDF?",
        answer:
          "Never. PDFivo does not add any watermarks, logos, or trial branding to your exported documents.",
      },
      {
        question: "Can I insert logos or stamp images onto pages?",
        answer:
          "Yes. Use the Image Stamp tool to upload PNG or JPG graphics and place them onto any specified page.",
      },
      {
        question: "Are my annotations editable in other PDF viewers?",
        answer:
          "Annotations are rendered cleanly into standard PDF content streams, ensuring universal visibility across all modern PDF readers.",
      },
      {
        question: "Are my documents uploaded to a remote server during editing?",
        answer:
          "Never. All vector additions, font embeddings, and image insertions execute locally in your web browser.",
      },
    ],
    relatedSlugs: ["sign-pdf", "watermark-pdf", "page-numbers-pdf", "compress-pdf"],
    seo: {
      title: "Edit PDF Online Free - PDFivo",
      description:
        "Add text, shapes, highlights, and images directly to PDF pages in your browser without watermarks. Start editing your PDF now.",
      keywords: [
        "edit pdf",
        "annotate pdf",
        "add text to pdf",
        "highlight pdf",
        "free pdf editor online",
      ],
    },
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxFiles: 1,
  },
];
