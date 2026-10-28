// CV uploads: PDF or Word (.docx), up to 5 MB (the API checks this too)

export const CV_ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const CV_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const CV_MAX = 5 * 1024 * 1024;

// Problem with the chosen file, or ''
export const cvFileError = (file) => {
  if (!file) return '';
  const okType = CV_TYPES.includes(file.type) || /\.(pdf|docx)$/i.test(file.name);
  if (!okType) return 'Your CV must be a PDF or a Word (.docx) file.';
  if (file.size > CV_MAX) return 'Your CV must be under 5 MB.';
  return '';
};

const LABELS = {
  profileHeadline: 'headline',
  aboutMe: 'about me',
  skills: 'skills',
  yearsOfExperience: 'years of experience',
  experience: 'work experience',
  education: 'education',
};

// "CV uploaded. We filled in your skills, work experience and education from it."
export const cvFilledText = (filled = []) => {
  const names = filled.map((k) => LABELS[k]).filter(Boolean);
  if (!names.length) return 'CV uploaded.';
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  return `CV uploaded. We filled in your ${list} from it — check them over on your profile.`;
};
