/**
 * catalogExpansion.js
 * ===================
 * Service catalog content: main category → service category → services.
 * Used by scripts/expandServiceCatalog.js, which only ADDS what is missing
 * (never renames or removes), so existing names are kept exactly as they are.
 *
 * Services are written as one string separated by "|" to keep the file short.
 * Goal: every category has 5+ service categories, each with 10+ services.
 */

module.exports = {
  // ─────────────────────────── EXISTING CATEGORIES ───────────────────────────
  'IT & Networking': {
    'Internet Services': 'WiFi Setup & Configuration|Network Troubleshooting|Fiber Optic Installation|Mesh Network Installation|Router Installation & Configuration|Internet Speed Optimization|Wi-Fi Extender & Access Point Setup|Home Internet Connection Setup|Hotspot & Captive Portal Setup|Internet Sharing for Apartments|Satellite Internet Installation',
    'CCTV & Security Systems': 'CCTV Camera Installation|Security System Maintenance|Access Control Systems|IP Camera Setup|DVR & NVR Configuration|Remote CCTV Viewing Setup|Alarm System Installation|Intercom & Video Door Phone Installation|Electric Fence Installation|Biometric Attendance Systems|CCTV Repair & Upgrades',
    'Computer Repair & Maintenance': 'Hardware Repair|Virus & Malware Removal|Data Recovery|Laptop Screen Replacement|Operating System Installation|Software Installation & Licensing|Computer Upgrade (RAM & SSD)|Printer Setup & Repair|Laptop Keyboard & Battery Replacement|PC Assembly & Custom Builds|Computer Servicing & Cleaning',
    'Network Infrastructure': 'Structured Cabling|Network Rack & Cabinet Installation|Office LAN Setup|Switch Configuration|Firewall Setup|VPN Setup|Server Room Setup|Network Audit & Documentation|VoIP Phone System Installation|Point-to-Point Wireless Links|Network Monitoring Setup',
    'IT Support & Cloud Services': 'Remote IT Support|Microsoft 365 / Google Workspace Setup|Email Setup & Migration|Cloud Backup Setup|Domain & Hosting Setup|Server Installation & Maintenance|Data Backup Solutions|IT Asset Management|Cybersecurity Assessment|Password & Account Recovery|Managed IT Support Contracts',
  },

  'Electrical Services': {
    'Residential Electrical': 'House Wiring & Rewiring|Lighting Installation|Ceiling Fan Installation|Circuit Breaker Replacement|Socket & Switch Installation|Electrical Fault Finding|Consumer Unit Installation|Outdoor & Security Lighting|Water Heater Wiring|Doorbell Installation|Earthing & Lightning Protection',
    'Commercial Electrical': 'Three-Phase Wiring|Electrical Panel Upgrades|Office Electrical Installation|Shop Fit-Out Wiring|Emergency Lighting Installation|Power Factor Correction|Distribution Board Installation|Electrical Load Assessment|Street & Parking Lighting|Industrial Motor Wiring|Electrical Compliance Inspection',
    'Power Backup Systems': 'Generator Installation|Generator Servicing & Repair|Changeover Switch Installation|Inverter Installation|UPS Installation & Repair|Battery Bank Installation|Automatic Transfer Switch (ATS) Setup|Generator Fuel System Maintenance|Power Surge Protection|Backup Power Sizing & Consultation',
    'Electrical Inspection & Safety': 'Electrical Safety Inspection|Wiring Certificate Preparation|Insulation Resistance Testing|Earth Resistance Testing|Thermal Imaging Inspection|Fire Alarm Wiring|Smoke Detector Installation|Electrical Audit for Buildings|Meter Box Installation & Relocation|Kenya Power Connection Preparation|Earth Leakage (RCD) Testing',
    'Smart Home & Automation': 'Smart Lighting Installation|Smart Switch & Socket Setup|Home Automation Systems|Motorized Gate Automation|Smart Thermostat Installation|Smart Doorbell Installation|Motion Sensor Lighting|Smart Home Hub Setup|Automated Curtains & Blinds|Voice Assistant Integration',
  },

  'Mechanical Services': {
    'General Mechanical': 'Mechanical Repair|Equipment Maintenance|Industrial Machinery|Bearing Replacement|Gearbox Repair|Machine Alignment|Lubrication Services|Pump Repair & Maintenance|Conveyor Belt Repair|Hydraulic System Repair|Pneumatic System Repair',
    'Industrial Machinery': 'Machine Installation|Machine Overhaul|Preventive Maintenance Programs|Boiler Maintenance|Compressor Repair|Lathe & Milling Machine Repair|Packaging Machine Repair|Food Processing Machine Repair|Industrial Fan Repair|Posho Mill & Grinder Repair',
    'Pumps & Water Systems': 'Water Pump Installation|Booster Pump Installation|Submersible Pump Repair|Pressure Tank Installation|Pump Motor Rewinding|Irrigation Pump Repair|Solar Pump Installation|Sewage Pump Repair|Pump Control Panel Setup|Pump Servicing',
    'Agricultural Machinery': 'Tractor Repair|Tractor Servicing|Harvester Repair|Chaff Cutter Repair|Milking Machine Repair|Knapsack Sprayer Repair|Plough & Harrow Repair|Planter Repair|Farm Machinery Welding|Grain Dryer Maintenance',
    'Engines & Small Machines': 'Small Engine Repair|Lawn Mower Repair|Chainsaw Repair|Water Pump Engine Repair|Outboard Motor Repair|Generator Engine Overhaul|Brush Cutter Repair|Pressure Washer Repair|Engine Rebuilding|Petrol Engine Tuning',
  },

  'Plumbing': {
    'General Plumbing': 'Leak Detection & Repair|Faucet Installation & Repair|Toilet Repair & Installation|Sink Installation|Shower Installation & Repair|Pipe Installation & Replacement|Burst Pipe Repair|Water Meter Installation|Bathroom Fittings Installation|Kitchen Plumbing|Valve Replacement',
    'Drainage & Sewer': 'Drain Cleaning & Unclogging|Sewer Line Inspection|Septic Tank Installation|Septic Tank Emptying (Exhauster)|Manhole Construction & Repair|Sewer Line Repair|Grease Trap Cleaning|Storm Drain Installation|Soak Pit Construction|CCTV Drain Inspection|Biodigester Installation',
    'Water Storage & Supply': 'Water Tank Installation|Water Tank Cleaning|Elevated Tank Stand Installation|Mains Water Connection|Rainwater Harvesting Setup|Gutter Installation|Low Water Pressure Fix|Water Filter Installation|Borehole to House Connection|Water Pipe Rerouting',
    'Hot Water Systems': 'Water Heater Installation|Water Heater Repair|Solar Water Heater Installation|Solar Water Heater Repair|Instant Shower Heater Installation|Boiler Plumbing|Hot Water Pipe Insulation|Heat Pump Water Heater Installation|Thermostat Replacement|Pressure Relief Valve Replacement',
    'Commercial Plumbing': 'Commercial Kitchen Plumbing|Public Toilet Installation|Plumbing for New Buildings|Fire Hydrant & Hose Reel Installation|Plumbing Maintenance Contracts|Hospital & Lab Plumbing|Hotel Plumbing|Water Treatment Plant Plumbing|Pipe Lagging|Backflow Prevention',
  },

  'Programming & AI': {
    'Web Development': 'Frontend Development|Backend Development|Full Stack Development|Business Website Design|E-commerce Website Development|WordPress Development|Website Maintenance|Website Speed Optimization|Landing Page Design|Web App Development|API Development & Integration',
    'Mobile Development': 'Android Development|iOS Development|Cross Platform Development|Flutter App Development|React Native App Development|App UI/UX Design|App Maintenance & Updates|App Store Publishing|M-Pesa Integration in Apps|Push Notification Setup|Mobile App Testing',
    'AI & Machine Learning': 'Data Analysis|ML Model Development|AI Solutions|Chatbot Development|Computer Vision Solutions|Natural Language Processing|AI Business Process Automation|Predictive Analytics|AI Model Deployment|Data Labeling & Annotation|LLM Integration',
    'Software & Systems': 'Custom Software Development|POS System Development|School Management Systems|Hospital Management Systems|Inventory Management Systems|ERP Implementation|Payroll Systems|Booking & Reservation Systems|Desktop Application Development|System Integration|Legacy System Modernization',
    'Data & DevOps': 'Database Design|Database Administration|Data Migration|Cloud Deployment (AWS / Azure / GCP)|CI/CD Pipeline Setup|Docker & Kubernetes Setup|Server Configuration|Payment Gateway Integration (M-Pesa & Card)|Dashboards & Reporting|Software Testing & QA|Code Review & Audit',
  },

  'Hairdressing & Beauty': {
    'Hair Services': 'Haircut|Styling|Coloring|Braiding|Dreadlocks (Locs) Installation|Locs Retwist & Maintenance|Weave Installation|Wig Installation & Styling|Relaxer & Treatment|Natural Hair Care|Cornrows|Kids Hairstyles',
    'Beauty Services': 'Makeup|Nail Art|Facials|Waxing|Eyebrow Shaping & Threading|Eyelash Extensions|Bridal Makeup|Manicure|Pedicure|Gel & Acrylic Nails|Henna Art',
    'Barber Services': "Men's Haircut|Beard Trim & Shaping|Clean Shave|Fade Haircut|Kids Haircut|Hair Dye for Men|Scalp Treatment|Home Barber Service|Hair Design & Patterns|Hot Towel Shave",
    'Spa & Massage': 'Swedish Massage|Deep Tissue Massage|Aromatherapy|Hot Stone Massage|Foot Reflexology|Body Scrub|Steam & Sauna Session|Couples Massage|Home Massage Service|Sports Massage',
    'Skin Care & Aesthetics': 'Acne Treatment|Skin Consultation|Chemical Peel|Microdermabrasion|Hyperpigmentation Treatment|Anti-Aging Facial|Body Contouring|Tattoo Removal|Teeth Whitening|Microblading',
  },

  'Carpentry & Furniture': {
    'Custom Furniture': "Custom Furniture Making|Furniture Repair|Furniture Restoration|Sofa Making|Bed Making|Dining Table & Chairs|TV Stands & Wall Units|Office Furniture Making|Outdoor Furniture|Children's Furniture|Furniture Assembly",
    'Cabinetry': 'Kitchen Cabinets|Wardrobes|Storage Units|Bathroom Vanities|Built-in Shelving|Shoe Racks|Display Cabinets|Bookshelves|Cabinet Repair & Refacing|Pantry Cabinets',
    'Doors & Windows': 'Door Installation|Door Repair|Door Frame Fitting|Window Frame Installation|Lock Installation|Sliding Door Installation|Flush Door Making|Panel Door Making|Hinge & Handle Replacement|Wooden Window Repair',
    'Upholstery': 'Sofa Reupholstery|Chair Reupholstery|Car Seat Upholstery|Headboard Upholstery|Cushion Making|Sofa Repair|Foam Replacement|Fabric Selection & Sourcing|Leather Upholstery|Office Chair Repair',
    'Structural Carpentry': 'Roof Trusses|Ceiling Installation|Wooden Flooring|Decking|Pergolas & Gazebos|Staircase Making|Timber Partitioning|Skirting & Cornices|Wooden Fencing|Formwork for Construction',
  },

  'Laundry & Dry Cleaning': {
    'Laundry Services': 'Wash & Fold|Dry Cleaning|Ironing Services|Pickup & Delivery Laundry|Same-Day Laundry|Weekly Laundry Service|Uniform Laundry|Baby Clothes Laundry|Bedding & Duvet Washing|Shoe Cleaning',
    'Specialty Cleaning': 'Wedding Dress Cleaning|Leather Cleaning|Curtain Cleaning|Suit Cleaning|Carpet Washing|Rug Cleaning|Duvet & Blanket Cleaning|Stain Removal|Delicate Fabric Cleaning|Traditional Attire Cleaning',
    'Commercial Laundry': 'Hotel Linen Laundry|Hospital Linen Laundry|Restaurant Linen Laundry|Gym Towel Laundry|School Uniform Laundry|Salon Towel Laundry|Corporate Uniform Contracts|Airbnb Linen Service|Industrial Workwear Cleaning|Linen Rental',
    'Garment Care & Alterations': 'Clothes Alterations|Hemming|Zip Replacement|Button Replacement|Garment Repair|Pressing & Steaming|Garment Storage|Fabric Dyeing|Clothes Resizing|Patching & Darning',
    'Household Fabrics': 'Sofa Cleaning|Mattress Cleaning|Car Interior Cleaning|Carpet Steam Cleaning|On-Site Curtain Steam Cleaning|Pillow Cleaning|Stuffed Toy Cleaning|Mosquito Net Washing|Table Linen Cleaning|Blanket Washing',
  },

  'Cleaning Services': {
    'Residential Cleaning': 'Deep House Cleaning|Standard House Cleaning|Move In/Out Cleaning|Kitchen Deep Cleaning|Bathroom Deep Cleaning|Window Cleaning|Post-Party Cleaning|Airbnb Cleaning|Weekly House Cleaning|Fridge & Oven Cleaning',
    'Commercial Cleaning': 'Office Cleaning|Restaurant Cleaning|Industrial Cleaning|School Cleaning|Hospital & Clinic Cleaning|Shop & Supermarket Cleaning|Warehouse Cleaning|Church & Hall Cleaning|Gym Cleaning|Cleaning Contracts',
    'Post-Construction Cleaning': 'Builders Cleaning|Paint & Cement Removal|Window Sticker Removal|Debris Removal|Floor Scrubbing & Polishing|Final Handover Cleaning|Dust Removal|Glass Cleaning|Tile Grout Cleaning|Site Cleanup',
    'Specialized Cleaning': 'Carpet Cleaning|Sofa & Upholstery Cleaning|Mattress Deep Cleaning|Water Tank Cleaning|High-Rise Window Cleaning|Pressure Washing|Solar Panel Cleaning|Gutter Cleaning|Disinfection & Sanitization|Kitchen Exhaust Cleaning',
    'Outdoor & Waste': 'Compound Cleaning|Garbage Collection|Waste Removal|Recycling Collection|Pavement & Driveway Washing|Swimming Pool Cleaning|Car Park Cleaning|Bush Clearing|Drainage Channel Cleaning|Graffiti Removal',
  },

  'Painting & Decorating': {
    'Painting Services': 'Interior Painting|Exterior Painting|Spray Painting|Roof Painting|Gate & Grill Painting|Wall Texture Painting|Wood Varnishing|Floor Painting|Epoxy Floor Coating|Road & Parking Marking|Repainting & Touch-ups',
    'Decorating Services': 'Wallpaper Installation|Decorative Finishes|Faux Finishing|Wall Murals|Stenciling|Wall Panel Installation|3D Wall Panels|Ceiling Decoration|Accent Walls|Gold Leaf Finishing',
    'Interior Design': 'Interior Design Consultation|Space Planning|Color Consultation|Living Room Design|Bedroom Design|Kitchen Design|Office Interior Design|Restaurant Interior Design|Lighting Design|Home Staging',
    'Surface Preparation': 'Wall Skimming|Plastering|Crack Repair|Damp Proofing|Sanding & Priming|Old Paint Removal|Wall Putty Application|Mould Treatment|Rust Treatment|Surface Cleaning before Painting',
    'Signage & Branding': 'Shop Sign Painting|Wall Branding|Vehicle Branding|Logo Painting|Billboard Painting|Signwriting|Glass Frosting & Stickers|Mural Advertising|Office Branding|Event Branding',
  },

  'Welding & Fabrication': {
    'Welding Services': 'MIG Welding|TIG Welding|Arc Welding|Gas Welding|Mobile On-Site Welding|Stainless Steel Welding|Aluminium Welding|Pipe Welding|Welding Repairs|Spot Welding',
    'Fabrication': 'Metal Fabrication|Steel Structures|Custom Metal Work|Steel Doors|Window Grills|Burglar Proofing|Steel Staircases|Handrails & Balustrades|Steel Roof Trusses|Water Tank Stands|Shelving & Racks',
    'Gates & Fencing': 'Gate Fabrication|Sliding Gates|Swing Gates|Gate Repair|Chain Link Fencing|Steel Palisade Fencing|Razor Wire Installation|Gate Motor Mounting|Pedestrian Gates|Fence Repair',
    'Automotive & Machinery Welding': 'Exhaust Welding|Chassis Repair|Trailer Fabrication|Truck Body Building|Tuk-Tuk & Motorcycle Carrier Fabrication|Tractor & Farm Equipment Welding|Bull Bar Fabrication|Roof Rack Fabrication|Tanker Repair|Heavy Machinery Welding',
    'Stainless & Specialty Work': 'Stainless Steel Kitchens|Commercial Kitchen Fabrication|Stainless Steel Railings|Food Processing Equipment Fabrication|Metal Signage|Ornamental Metalwork|Metal Furniture|Laser & Plasma Cutting|Sheet Metal Work|Galvanised Steel Work',
  },

  'Automotive Repair': {
    'Engine & Mechanical': 'Engine Diagnostics|Brake Service|Oil Change|Transmission Repair|Engine Overhaul|Clutch Repair|Suspension Repair|Steering Repair|Timing Belt Replacement|Radiator & Cooling System Repair|Car Servicing',
    'Body & Paint': 'Panel Beating|Spray Painting|Rust Removal|Dent Removal|Scratch Repair|Bumper Repair|Windscreen Replacement|Full Car Respray|Car Polishing & Buffing|Accident Repair',
    'Auto Electrical': 'Car Battery Replacement|Alternator Repair|Starter Motor Repair|Car Wiring Repair|Car Alarm Installation|Car Tracking Device Installation|Car Lighting Repair|Car AC Repair|Dashboard Warning Light Diagnosis|Car Audio Installation',
    'Tyres & Wheels': 'Tyre Replacement|Puncture Repair|Wheel Alignment|Wheel Balancing|Rim Repair|Tyre Rotation|Mobile Tyre Service|Tubeless Conversion|Nitrogen Inflation|Spare Wheel Fitting',
    'Car Care & Detailing': 'Car Wash|Interior Detailing|Exterior Detailing|Engine Bay Cleaning|Ceramic Coating|Paint Protection|Headlight Restoration|Car Upholstery Cleaning|Odour Removal|Mobile Car Wash',
    'Motorcycle Repair': 'Motorcycle Servicing|Motorcycle Engine Repair|Motorcycle Brake Repair|Motorcycle Electrical Repair|Motorcycle Tyre Replacement|Chain & Sprocket Replacement|Motorcycle Body Repair|Boda Boda Maintenance|Motorcycle Clutch Repair|Carburetor Cleaning',
  },

  'Tutoring & Training': {
    'Academic Tutoring': 'Mathematics|Science|Languages|Test Preparation|English|Kiswahili|Physics|Chemistry|Biology|Computer Studies|Homework Help',
    'Professional Training': 'IT Training|Business Skills|Soft Skills|Leadership Training|Project Management|Accounting & Bookkeeping|Customer Service Training|Sales Training|Entrepreneurship|Public Speaking|First Aid Training',
    'Exam Preparation': 'KJSEA / KCPE Revision|KCSE Revision|IGCSE Tutoring|A-Level Tutoring|IB Tutoring|SAT Preparation|IELTS / TOEFL Preparation|CPA Revision|ACCA Revision|University Entrance Preparation',
    'Language Lessons': 'English Lessons|Kiswahili Lessons|French Lessons|German Lessons|Mandarin Chinese Lessons|Spanish Lessons|Arabic Lessons|Sign Language|Business English|Languages for Kids',
    'Music & Arts Lessons': 'Piano Lessons|Guitar Lessons|Drum Lessons|Singing Lessons|Violin Lessons|Keyboard Lessons|Saxophone Lessons|Art & Drawing Classes|Dance Classes|Music Theory',
    'Technical & Vocational': 'Driving Lessons|Computer Packages Training|Coding for Kids|Graphic Design Training|Tailoring Training|Hairdressing Training|Cooking Classes|Electrical Installation Training|Plumbing Training|Welding Training',
  },

  'Photography & Videography': {
    'Photography': 'Wedding Photography|Event Photography|Portrait Photography|Product Photography|Family Photoshoot|Graduation Photography|Real Estate Photography|Food Photography|Fashion Photography|Corporate Headshots|Passport Photos',
    'Videography': 'Event Videography|Wedding Videography|Corporate Video|Drone Videography|Music Video Production|Documentary Production|Livestreaming|Video Editing|Promotional Video|Funeral Coverage',
    'Drone Services': 'Aerial Photography|Aerial Videography|Land & Plot Mapping|Construction Progress Monitoring|Drone Roof Inspection|Agricultural Drone Survey|Event Drone Coverage|Real Estate Aerial Tours|Drone Surveying|Infrastructure Inspection',
    'Photo & Video Editing': 'Photo Retouching|Photo Restoration|Background Removal|Color Grading|Video Post-Production|Motion Graphics|Subtitles & Captions|Photo Book Design|Video Montage|Album Design',
    'Studio & Commercial': 'Studio Photoshoot|Commercial Advertising Shoot|Social Media Content Creation|Catalog Photography|360° Product Photography|Podcast Recording|Studio Rental|Model Portfolio Shoot|Branding Photoshoot|Reels & Short Video Production',
  },

  'Event Planning': {
    'Event Planning': 'Wedding Planning|Corporate Events|Birthday Parties|Conferences|Baby Showers|Graduation Parties|Bridal Showers|Anniversary Celebrations|Product Launches|Funeral Arrangements|Ruracio & Traditional Ceremonies',
    'Event Services': 'Catering|Decorations|Entertainment|Event Photography|MC Services|DJ Services|Event Security|Ushering Services|Event Cleaning|Event Transport',
    'Equipment Rental': 'Tent Hire|Chairs & Tables Hire|PA System Hire|Lighting Hire|Stage Hire|Décor Hire|Portable Toilet Hire|Generator Hire|LED Screen Hire|Cutlery & Crockery Hire',
    'Venue & Decor': 'Venue Sourcing|Floral Arrangements|Balloon Decoration|Table Setting|Backdrop Design|Lighting Decoration|Theme Decoration|Wedding Car Decoration|Centerpieces|Red Carpet Setup',
    'Event Entertainment': 'Live Band|Acrobats|Magicians|Kids Entertainment|Traditional Dancers|Comedians|Bouncing Castles|Face Painting|Karaoke Setup|Photo Booth',
  },

  'Construction & Renovation': {
    'Construction': 'Building Construction|Roofing|Flooring|Tiling|Foundation Works|Masonry & Stone Work|Concrete Works|Bricklaying|Plastering|Gypsum Ceiling Installation|Perimeter Wall Construction',
    'Renovation': 'Home Renovation|Kitchen Remodeling|Bathroom Renovation|Basement Finishing|Office Renovation|Shop Renovation|House Extension|Loft Conversion|Floor Replacement|Facade Renovation',
    'Roofing Works': 'Roof Installation|Roof Repair|Roof Leak Repair|Mabati Roofing|Tile Roofing|Gutter & Downpipe Installation|Roof Waterproofing|Roof Insulation|Fascia Board Installation|Roof Inspection',
    'Architecture & Planning': 'Architectural Design|House Plans|Structural Engineering|Quantity Surveying|Building Approval Processing|3D Rendering|Interior Layout Planning|Site Supervision|Bill of Quantities|Land Surveying',
    'Paving & Outdoor Works': 'Cabro / Paving Blocks|Driveway Construction|Walkway Paving|Retaining Walls|Drainage Channels|Septic & Soak Pit Works|Outdoor Kitchen|Water Tank Platform|Carport Construction|Kerb Installation',
  },

  'HVAC Services': {
    'Air Conditioning': 'AC Installation|AC Repair|AC Maintenance|Ventilation System Maintenance|Heating System Repair|Duct Cleaning|Split AC Installation|AC Gas Refilling|AC Relocation|Central AC Systems|AC Servicing Contracts',
    'Refrigeration': 'Refrigerator Repair|Cold Room Installation|Commercial Refrigeration|Freezer Repair|Display Fridge Repair|Ice Machine Repair|Refrigerant Recharge|Cold Room Maintenance|Beverage Cooler Repair|Chiller Maintenance',
    'Ventilation': 'Extractor Fan Installation|Kitchen Hood Installation|Industrial Ventilation|Fresh Air Systems|Ventilation Design|Bathroom Fan Installation|Fume Extraction|Ventilation Repair|Air Curtain Installation|Warehouse Ventilation',
    'Heating': 'Heater Installation|Heat Pump Installation|Underfloor Heating|Boiler Installation|Boiler Servicing|Radiator Installation|Space Heater Repair|Fireplace Installation|Thermostat Installation|Heating System Maintenance',
    'Air Quality': 'Air Purifier Installation|Dehumidifier Installation|Humidifier Installation|Air Quality Testing|Mould Remediation|Duct Sanitization|HEPA Filter Replacement|Odour Control|Clean Room Setup|Indoor Air Quality Consultation',
  },

  'Appliance Repair': {
    'Kitchen Appliances': 'Refrigerator Repair|Oven Repair|Dishwasher Repair|Microwave Repair|Cooker Repair|Gas Cooker Repair|Hot Plate Repair|Blender Repair|Coffee Machine Repair|Water Dispenser Repair|Extractor Hood Repair',
    'Laundry Appliances': 'Washing Machine Repair|Dryer Repair|Washer/Dryer Combo|Washing Machine Installation|Washing Machine Drum Replacement|Front Loader Repair|Top Loader Repair|Iron Repair|Commercial Washer Repair|Dryer Vent Cleaning',
    'TV & Electronics': 'TV Repair|TV Wall Mounting|Home Theatre Repair|Sound System Repair|Decoder Installation|Satellite Dish Installation|DStv / GOtv Installation|Speaker Repair|Projector Repair|Amplifier Repair',
    'Small Appliances': 'Kettle Repair|Toaster Repair|Hair Dryer Repair|Vacuum Cleaner Repair|Fan Repair|Electric Heater Repair|Rice Cooker Repair|Juicer Repair|Sewing Machine Repair|Air Fryer Repair',
    'Gas & Cooking Systems': 'Gas Cylinder Installation|Gas Leak Detection|Gas Pipe Installation|Gas Burner Repair|Gas Regulator Replacement|Commercial Gas Systems|Biogas Stove Installation|Gas Oven Installation|Gas Safety Inspection|Cooker Conversion',
  },

  'Moving & Logistics': {
    'Moving Services': 'Local Moving|Long Distance Moving|Packing Services|Unpacking Services|House Moving|Office Moving|Furniture Moving|Piano Moving|Student Moving|Same-Day Moving|Cross-Border Moving',
    'Logistics': 'Storage Services|Delivery Services|Freight Services|Courier Services|Parcel Delivery|Last-Mile Delivery|Cargo Transport|Container Transport|Warehousing|Cold Chain Transport',
    'Truck & Vehicle Hire': 'Pickup Hire|Lorry Hire|Canter Hire|Van Hire|Tipper Hire|Trailer Hire|Driver Hire|Crane Hire|Forklift Hire|Bus Hire',
    'Packing & Storage': 'Packing Materials Supply|Furniture Wrapping|Fragile Item Packing|Crating Services|Short-Term Storage|Long-Term Storage|Document Storage|Vehicle Storage|Inventory Management|Self Storage',
    'Errands & Delivery': 'Errand Running|Grocery Delivery|Pharmacy Delivery|Document Delivery|Gas Delivery|Water Delivery|Restaurant Delivery|Shopping Assistance|Bill Payment Errands|Airport Pickup & Drop-off',
  },

  'Gardening & Landscaping': {
    'Gardening': 'Lawn Care|Tree Services|Irrigation Systems|Garden Design|Lawn Mowing|Hedge Trimming|Weeding|Flower Planting|Vegetable Garden Setup|Composting|Fertilizer Application',
    'Landscaping': 'Landscape Design|Hardscaping|Planting Services|Landscape Maintenance|Lawn Installation|Water Features|Rock Gardens|Garden Lighting|Garden Paths|Terracing',
    'Tree Care': 'Tree Felling|Tree Pruning|Stump Removal|Tree Planting|Tree Health Assessment|Hedge Planting|Fruit Tree Care|Tree Transplanting|Palm Tree Trimming|Emergency Tree Removal',
    'Irrigation & Water': 'Drip Irrigation Installation|Sprinkler System Installation|Irrigation Repair|Garden Rainwater Harvesting|Greenhouse Irrigation|Garden Borehole Connection|Garden Water Tank|Automatic Timer Setup|Irrigation Design|Pond Installation',
    'Farm & Greenhouse': 'Greenhouse Construction|Greenhouse Repair|Shade Net Installation|Farm Consultancy|Soil Testing|Hydroponics Setup|Kitchen Garden Setup|Seedling Supply|Agronomy Services|Farm Fencing',
  },

  // ───────────────────────────── NEW CATEGORIES ──────────────────────────────
  'Solar & Renewable Energy': {
    'Solar Installation': 'Solar Panel Installation|Off-Grid Solar Systems|Grid-Tied Solar Systems|Hybrid Solar Systems|Home Solar Systems|Business Solar Systems|Solar Street Lights|Solar Security Lights|Solar Panel Mounting|Solar System Design|Solar Battery Installation',
    'Solar Maintenance & Repair': 'Solar Panel Cleaning|Solar System Repair|Solar Inverter Repair|Solar Battery Replacement|Charge Controller Replacement|Solar System Upgrade|Solar Wiring Repair|Solar Performance Testing|Solar System Relocation|Annual Solar Servicing',
    'Solar Water & Pumping': 'Solar Water Heater Installation|Solar Water Heater Repair|Solar Water Pump Installation|Solar Borehole Pump|Solar Irrigation Systems|Solar Pump Repair|Solar Water Heater Servicing|Evacuated Tube Heater Installation|Flat Plate Heater Installation|Solar Pool Heating',
    'Energy Efficiency': 'Energy Audit|LED Lighting Retrofit|Power Consumption Analysis|Smart Meter Installation|Insulation for Energy Saving|Energy-Saving Consultation|Power Factor Improvement|Load Management|Solar Sizing Consultation|Green Building Consultation',
    'Other Renewables': 'Biogas Installation|Biogas Repair|Wind Turbine Installation|Clean Cookstove Installation|Briquette Machine Setup|Micro-Hydro Setup|Solar Dryer Installation|Solar Cooker Supply|Biodigester Maintenance|Renewable Energy Consultation',
  },

  'Pest Control & Fumigation': {
    'Residential Pest Control': 'Cockroach Control|Bedbug Treatment|Rat & Mice Control|Termite Control|Ant Control|Flea Treatment|Mosquito Control|Spider Control|Snake Removal|Bat Removal',
    'Commercial Pest Control': 'Restaurant Pest Control|Hotel Pest Control|Office Pest Control|Warehouse Pest Control|School Pest Control|Hospital Pest Control|Food Factory Pest Control|Supermarket Pest Control|Pest Control Contracts|Pest Audit & Reporting',
    'Fumigation': 'House Fumigation|Office Fumigation|Warehouse Fumigation|Grain Store Fumigation|Container Fumigation|Vehicle Fumigation|Furniture Fumigation|Pre-Construction Termite Treatment|Post-Construction Termite Treatment|Disinfection & Sanitizing',
    'Wildlife & Bird Control': 'Bird Control & Netting|Pigeon Control|Bee & Wasp Removal|Beehive Relocation|Monkey Control|Mole Control|Squirrel Control|Snake Proofing|Bird Spikes Installation|Animal Trapping',
    'Agricultural Pest Control': 'Crop Spraying|Livestock Pest Control|Tick Control|Fruit Fly Control|Weed Control|Greenhouse Pest Control|Armyworm Control|Stored Grain Pest Control|Integrated Pest Management|Organic Pest Control',
  },

  'Security Services': {
    'Guarding': 'Security Guards|Night Watchmen|Event Security|Bodyguards & VIP Protection|Patrol Services|Construction Site Security|Estate Security|School Security|Cash-in-Transit Escort|Dog Handler Services',
    'Security Systems': 'Alarm Installation|Panic Button Installation|Electric Fence Installation|CCTV Installation|Access Control Installation|Biometric Locks|Intercom Installation|Security Lighting|Perimeter Intrusion Detection|Smart Lock Installation',
    'Locksmith Services': 'Lock Installation|Lock Repair|Emergency Lockout|Key Duplication|Safe Opening|Safe Installation|Car Lockout Service|Padlock Supply & Fitting|Master Key Systems|Lock Rekeying',
    'Alarm Response & Monitoring': '24/7 Alarm Monitoring|Armed Response|GPS Vehicle Tracking|Remote CCTV Monitoring|Fire Alarm Monitoring|Panic Alarm Response|Lone Worker Monitoring|Security Control Room Setup|Mobile Patrol Response|Monitoring Contracts',
    'Security Consultancy': 'Security Risk Assessment|Security Audit|Investigation Services|Background Checks|Security Training|Emergency Response Planning|Loss Prevention|Event Security Planning|Cybersecurity Awareness|Fire Safety Assessment',
  },

  'Health & Wellness': {
    'Fitness Training': 'Personal Training|Home Fitness Sessions|Weight Loss Programs|Strength Training|Yoga Classes|Pilates|Aerobics|Boxing Training|Group Fitness Classes|Online Fitness Coaching',
    'Physiotherapy': 'Home Physiotherapy|Sports Injury Rehab|Back Pain Treatment|Post-Surgery Rehab|Stroke Rehabilitation|Elderly Mobility Therapy|Neck & Shoulder Therapy|Joint Pain Therapy|Pediatric Physiotherapy|Therapeutic Massage',
    'Nutrition & Diet': 'Nutrition Consultation|Meal Planning|Weight Management|Diabetic Diet Planning|Sports Nutrition|Pregnancy Nutrition|Child Nutrition|Healthy Cooking Coaching|Gut Health Coaching|Corporate Wellness Programs',
    'Home Nursing & Care': 'Home Nursing|Elderly Care|Post-Hospital Care|Palliative Care|Wound Dressing|Injection Administration|Blood Pressure & Sugar Monitoring|Caregiver Services|Disability Support|Medication Management',
    'Mental Wellness': 'Counseling Sessions|Life Coaching|Stress Management|Couples Counseling|Family Therapy|Grief Counseling|Addiction Support|Meditation Classes|Teen Counseling|Corporate Mental Wellness',
  },

  'Tailoring & Fashion': {
    'Tailoring': 'Custom Suits|Dress Making|Shirt Making|Trouser Making|School Uniforms|Corporate Uniforms|Kitenge & African Wear|Wedding Gowns|Bridesmaid Dresses|Traditional Attire|Kids Clothing',
    'Alterations & Repairs': 'Clothes Alterations|Hemming|Resizing|Zip Replacement|Button Replacement|Tear Repair|Wedding Dress Alterations|Suit Alterations|Curtain Alterations|Leather Jacket Repair',
    'Fashion Design': 'Fashion Consultation|Custom Design|Pattern Making|Fashion Sketching|Collection Development|Costume Design|Fabric Sourcing|Wardrobe Styling|Personal Shopping|Fashion Show Styling',
    'Embroidery & Printing': 'Embroidery|Logo Embroidery|T-Shirt Printing|Screen Printing|Heat Press Printing|Branded Uniforms|Name Tags & Badges|Cap Embroidery|Bag Printing|Monogramming',
    'Shoes & Leather': 'Shoe Repair|Shoe Making|Shoe Shining|Sole Replacement|Leather Bag Repair|Belt Making|Sandal Making|Leather Jacket Making|Handbag Making|Zip & Strap Repair',
  },

  'Catering & Chefs': {
    'Event Catering': 'Wedding Catering|Corporate Catering|Party Catering|Funeral Catering|Outdoor Catering|Buffet Service|Nyama Choma Catering|Cocktail Catering|Breakfast Catering|Conference Catering',
    'Private Chef': 'Private Chef at Home|Dinner Party Chef|Weekly Meal Prep|Holiday Chef|Special Diet Cooking|Romantic Dinner Setup|Family Meal Cooking|Live Cooking Stations|Chef for Airbnb Guests|Corporate Chef',
    'Baking & Desserts': 'Wedding Cakes|Birthday Cakes|Custom Cakes|Cupcakes|Pastries|Bread Baking|Cookies|Dessert Tables|Cake Decorating|Cake Delivery',
    'Food Services': 'Office Lunch Delivery|School Meals|Meal Subscriptions|Packed Lunches|Food Truck Hire|Juice & Smoothie Bar|Barbecue Service|Bartending Services|Coffee & Tea Service|Food Tasting Sessions',
    'Kitchen Staff & Training': 'Cooks for Hire|Waiters & Waitresses|Kitchen Assistants|Food Safety Training|Menu Planning|Restaurant Consultation|Cooking Lessons|Kitchen Setup Consultation|Recipe Development|Kitchen Hygiene Audits',
  },

  'Digital Marketing & Design': {
    'Graphic Design': 'Logo Design|Brand Identity|Business Card Design|Flyers & Posters|Brochures|Social Media Graphics|Banners & Roll-ups|Packaging Design|Infographics|Company Profile Design',
    'Social Media Marketing': 'Social Media Management|Facebook & Instagram Ads|TikTok Marketing|Content Creation|Influencer Marketing|Community Management|Social Media Strategy|LinkedIn Marketing|YouTube Channel Management|WhatsApp Business Setup',
    'Digital Advertising': 'Google Ads|Search Engine Optimization (SEO)|Email Marketing|SMS Marketing|Pay-Per-Click Campaigns|Retargeting Ads|Google Business Profile Setup|Analytics & Reporting|Marketing Strategy|Conversion Optimization',
    'Content & Copywriting': 'Copywriting|Blog Writing|Website Content|Product Descriptions|Press Releases|Scriptwriting|Proofreading & Editing|Translation Services|Technical Writing|CV & Cover Letter Writing',
    'Printing & Branding': 'Large Format Printing|Business Card Printing|Brochure Printing|Branded Merchandise|Vehicle Branding|Signage Design|Sticker & Label Printing|Banner Printing|Calendar & Diary Printing|Event Branding Materials',
  },

  'Phone & Electronics Repair': {
    'Phone Repair': 'Screen Replacement|Battery Replacement|Charging Port Repair|Water Damage Repair|Phone Camera Repair|Speaker & Microphone Repair|Software Flashing|Phone Unlocking|Back Glass Replacement|Button Repair',
    'Tablet & Laptop Repair': 'Tablet Screen Replacement|Laptop Screen Repair|Laptop Battery Replacement|Laptop Keyboard Replacement|Laptop Charging Port Repair|Motherboard Repair|Overheating Fix|Hinge Repair|Laptop Upgrade|iPad Repair',
    'Device Setup & Accessories': 'Screen Protector Installation|Phone Case Supply|Data Transfer|New Phone Setup|Backup & Restore|App Installation|Email Setup on Phone|Smartwatch Setup|Bluetooth Device Pairing|Phone Cleaning',
    'Electronics Repair': 'Radio Repair|Speaker Repair|Gaming Console Repair|Camera Repair|Drone Repair|Power Bank Repair|Smartwatch Repair|Headphone Repair|Electronic Board Repair|Charger Repair',
    'Data & Software': 'Phone Data Recovery|Phone Virus Removal|Software Updates|Google Account (FRP) Unlock|Factory Reset|IMEI Repair|Contact Recovery|Photo Recovery|Phone Speed Optimization|Parental Controls Setup',
  },

  'Water & Borehole Services': {
    'Borehole Services': 'Borehole Drilling|Hydrogeological Survey|Borehole Pump Installation|Borehole Maintenance|Borehole Flushing|Borehole Test Pumping|Borehole Rehabilitation|Borehole Casing|Borehole Permit Processing|Shallow Well Digging',
    'Water Treatment': 'Water Purification Systems|Reverse Osmosis Installation|Water Softener Installation|UV Water Treatment|Water Quality Testing|Borehole Water Treatment|Chlorination Systems|Iron & Fluoride Removal|Water Filter Servicing|Water Vending Machine Setup',
    'Water Tanks': 'Water Tank Installation|Tank Cleaning|Tank Repair|Underground Tank Construction|Elevated Tank Stands|Tank Level Sensors|Tank Relocation|Water Tower Construction|Overflow & Valve Repair|Tank Disinfection',
    'Water Supply & Distribution': 'Water Pipeline Installation|Water Reticulation|Water Meter Installation|Pressure Booster Systems|Water Kiosk Setup|Water Bowser Delivery|Fire Water Systems|Estate Water Systems|Leak Detection|Water Connection Applications',
    'Irrigation & Harvesting': 'Rainwater Harvesting Systems|Gutter & Downpipe Installation|Dam & Pond Construction|Water Pan Lining|Drip Irrigation|Sprinkler Irrigation|Greywater Recycling|Water Storage Design|Farm Water Planning|Pond Liner Repair',
  },

  'Domestic & Care Services': {
    'House Help': 'Live-in House Help|Day House Help|Cooking Help|Cleaning Help|Laundry Help|Weekend Help|Emergency House Help|House Manager|Part-Time House Help|Airbnb Housekeeping',
    'Childcare': 'Nanny Services|Babysitting|After-School Care|Newborn Care|Night Nanny|Special Needs Childcare|Child Minder|Holiday Childcare|Daycare|Tutoring Nanny',
    'Elderly & Special Care': 'Elderly Companion|Live-in Caregiver|Day Caregiver|Dementia Care|Disability Care|Respite Care|Hospital Sitter|Mobility Assistance|Personal Care Assistance|Meal Assistance for Elderly',
    'Pet Care': 'Dog Walking|Pet Sitting|Pet Grooming|Pet Training|Pet Boarding|Pet Feeding Visits|Pet Taxi|Veterinary Home Visits|Pet Bathing|Aquarium Cleaning',
    'Home Management': 'Home Organizing|Decluttering|Grocery Shopping|Meal Preparation|Home Maintenance Coordination|House Sitting|Plant Watering|Laundry Folding & Organizing|Closet Organizing|Move-in Setup',
  },

  // Experts who work with the properties listed under Stays & Spaces
  'Property & Real Estate': {
    'Property Management': 'Residential Property Management|Commercial Property Management|Rent Collection|Tenant Screening|Lease Preparation & Renewal|Property Inspections|Maintenance Coordination|Service Charge Management|Estate & Apartment Management|Short-Stay (Airbnb) Management',
    'Real Estate Agents': 'Rental Listing & Letting|Property Sales|Land Sales|Property Valuation|Office & Commercial Letting|Buyer Representation|Property Marketing & Photography|Market Price Advice|Title Search Assistance|Property Investment Advice',
    'House Hunting': 'House Hunting Assistance|Office Space Search|Student Room Search|Relocation Assistance|Viewing Arrangement|Neighbourhood Tours|Rental Negotiation|Move-in Inspection|Short-Stay Booking Help|Expat Housing Assistance',
    'Short-Stay Hosting Services': 'Airbnb Setup & Listing|Guest Check-in Service|Turnover Cleaning|Linen & Laundry for Hosts|Listing Photography|Pricing & Calendar Management|Guest Communication|Interior Setup for Rentals|Amenities Restocking|Host Co-hosting',
    'Landlord Services': 'Tenancy Agreements|Rent Arrears Follow-up|Tenant Move-out Inspection|Deposit Settlement|Utility Bill Management|Caretaker Services|Property Repairs Coordination|Eviction Process Guidance|Rental Income Reporting|Property Insurance Advice',
  },
};
