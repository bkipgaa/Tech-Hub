
```
tech-hub
├─ backend
│  ├─ config
│  │  ├─ cloudinary.js
│  │  └─ paystack.js
│  ├─ controllers
│  │  ├─ admin
│  │  │  └─ adminJobController.js
│  │  ├─ adminController.js
│  │  ├─ authcontroller.js
│  │  ├─ bookingratingController.js
│  │  ├─ chatController.js
│  │  ├─ commissionPaymentController.js
│  │  ├─ jobApplicationController.js
│  │  ├─ jobController.js
│  │  ├─ searchController.js
│  │  ├─ serviceCatalogController.js
│  │  ├─ subscriptionController.js
│  │  └─ technician
│  │     ├─ profile
│  │     │  ├─ addService-category.js
│  │     │  ├─ createProfile.js
│  │     │  ├─ deleteProfile.js
│  │     │  ├─ getProfile.js
│  │     │  ├─ helpers.js
│  │     │  ├─ updateAvailability.js
│  │     │  ├─ updateBasicInfo.js
│  │     │  ├─ updateBusiness.js
│  │     │  ├─ updateCertifications.js
│  │     │  ├─ updateEducation.js
│  │     │  ├─ updateExperience.js
│  │     │  ├─ updateLanguages.js
│  │     │  ├─ updateLocation.js
│  │     │  ├─ updatePortfolio.js
│  │     │  ├─ updatePricing.js
│  │     │  ├─ updateProfile.js
│  │     │  ├─ updateProfileStatus.js
│  │     │  ├─ updateSettings.js
│  │     │  ├─ updateSkills.js
│  │     │  └─ updateSocialLinks.js
│  │     └─ publicController.js
│  ├─ middleware
│  │  ├─ AdminAuth.js
│  │  ├─ auth.js
│  │  └─ validation.js
│  ├─ models
│  │  ├─ backend.code-workspace
│  │  ├─ Booking.js
│  │  ├─ Conversation.js
│  │  ├─ Job.js
│  │  ├─ jobApplication.js
│  │  ├─ jobs.js
│  │  ├─ Message.js
│  │  ├─ ServiceCatalog.js
│  │  ├─ Technician.js
│  │  └─ User.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ Procfile
│  ├─ routes
│  │  ├─ admin
│  │  │  └─ adminJobRoutes.js
│  │  ├─ adminRoutes.js
│  │  ├─ authRoutes.js
│  │  ├─ bookingRoutes.js
│  │  ├─ chatRoutes.js
│  │  ├─ commissionPaymentRoutes.js
│  │  ├─ jobApplicationRoutes.js
│  │  ├─ jobRoutes.js
│  │  ├─ searchRoutes.js
│  │  ├─ serviceCatalogRoutes.js
│  │  ├─ subscriptionRoutes.js
│  │  ├─ technicianProfileRoutes.js
│  │  ├─ technicianRoutes.js
│  │  └─ upload.js
│  ├─ scripts
│  │  ├─ backfillServiceCategoryMainCategory.js
│  │  ├─ cleanup-technicians.js
│  │  ├─ populateServiceCatalog.js
│  │  ├─ populateTechnicians.js
│  │  ├─ populateTechniciansWithPlans.js
│  │  ├─ seedJobs.js
│  │  ├─ seedMissingCategories.js
│  │  └─ seedServiceCatalog.js
│  ├─ server.js
│  ├─ services
│  │  └─ mpesaService.js
│  ├─ socket
│  │  └─ chatSocket.js
│  └─ utils
│     ├─ cloudinaryHelpers.js
│     ├─ emailService.js
│     ├─ helper.js
│     ├─ sendEmail.js
│     └─ subscriptionPlans.js
└─ frontend
   ├─ eslint.config.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ postcss.config.js
   ├─ public
   │  └─ vite.svg
   ├─ README.md
   ├─ src
   │  ├─ App.css
   │  ├─ App.jsx
   │  ├─ assets
   │  │  └─ react.svg
   │  ├─ components
   │  │  ├─ admin
   │  │  │  ├─ adminDashboard.jsx
   │  │  │  ├─ AdminLayout.jsx
   │  │  │  ├─ AdminVerifyJobs.jsx
   │  │  │  ├─ JobsManagement.jsx
   │  │  │  ├─ SubscriptionStats.jsx
   │  │  │  ├─ TechnicianDetails.jsx
   │  │  │  └─ TechnicianList.jsx
   │  │  ├─ AdminRoute.jsx
   │  │  ├─ applications
   │  │  │  ├─ ApplicationCard.jsx
   │  │  │  ├─ ApplicationDetails.jsx
   │  │  │  ├─ ApplyModal.jsx
   │  │  │  ├─ JobApplicationsList.jsx
   │  │  │  └─ MyApplications.jsx
   │  │  ├─ chat
   │  │  │  ├─ ChatPage.jsx
   │  │  │  ├─ ChatSidebar.jsx
   │  │  │  └─ MessageBubble.jsx
   │  │  ├─ common
   │  │  │  └─ Loader.jsx
   │  │  ├─ Footer.jsx
   │  │  ├─ jobs
   │  │  │  ├─ Availablejobs.jsx
   │  │  │  ├─ EditJob.jsx
   │  │  │  ├─ jobCard.jsx
   │  │  │  ├─ JobDetails.jsx
   │  │  │  ├─ jobSearch.jsx
   │  │  │  ├─ MyJobs.jsx
   │  │  │  └─ postJob.jsx
   │  │  ├─ Layout.jsx
   │  │  ├─ Navbar.jsx
   │  │  ├─ PrivateRoute.jsx
   │  │  ├─ technician
   │  │  │  ├─ common
   │  │  │  │  ├─ Header.jsx
   │  │  │  │  ├─ ProfileCompletionBar.jsx
   │  │  │  │  ├─ TabNavigation.jsx
   │  │  │  │  └─ VerificationBanner.jsx
   │  │  │  ├─ subscriptionManager.jsx
   │  │  │  ├─ tabs
   │  │  │  │  ├─ AvailabilityTab.jsx
   │  │  │  │  ├─ BusinessTab.jsx
   │  │  │  │  ├─ CredentialsTab.jsx
   │  │  │  │  ├─ PortfolioTab.jsx
   │  │  │  │  ├─ ProfileTab.jsx
   │  │  │  │  ├─ ServicesTab.jsx
   │  │  │  │  └─ SettingsTab.jsx
   │  │  │  └─ TechnicianDashboard.jsx
   │  │  ├─ TechnicianCard.jsx
   │  │  ├─ TechnicianRoute.jsx
   │  │  └─ TokenDisplay.jsx
   │  ├─ context
   │  │  └─ AuthContext.jsx
   │  ├─ hooks
   │  │  └─ useLocation.js
   │  ├─ index.css
   │  ├─ main.jsx
   │  ├─ pages
   │  │  ├─ Admin
   │  │  │  ├─ AdminLogin.jsx
   │  │  │  └─ AdminRegister.jsx
   │  │  ├─ BecomeTechnician.jsx
   │  │  ├─ BookingDetails.jsx
   │  │  ├─ BookService.jsx
   │  │  ├─ CreateTechnicianProfile.jsx
   │  │  ├─ ForgotPassword.jsx
   │  │  ├─ Home.jsx
   │  │  ├─ jobsPage.jsx
   │  │  ├─ Login.jsx
   │  │  ├─ PaymentCallback.jsx
   │  │  ├─ Profile.jsx
   │  │  ├─ ResetPassword.jsx
   │  │  ├─ Search.jsx
   │  │  ├─ Services.jsx
   │  │  ├─ SignUp.jsx
   │  │  ├─ TechnicianBookings.jsx
   │  │  ├─ TechnicianCommission.jsx
   │  │  ├─ TechnicianProfile.jsx
   │  │  ├─ Technicians.jsx
   │  │  └─ TechnicianSearchResults.jsx
   │  ├─ services
   │  │  ├─ adminJobService.js
   │  │  ├─ api.js
   │  │  ├─ applicationService.js
   │  │  ├─ jobService.js
   │  │  ├─ locationService.js
   │  │  └─ socket.js
   │  └─ utils
   ├─ tailwind.config.js
   ├─ vercel.json
   └─ vite.config.js

```