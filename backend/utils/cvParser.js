/**
 * cvParser.js
 * ===========
 * Reads an uploaded CV (PDF or .docx) and pulls out the parts of an expert
 * profile it can: headline, about, skills, years of experience, work
 * experience and education.
 *
 * With ANTHROPIC_API_KEY set, Claude reads the CV (much better with unusual
 * layouts). Without it, or if that call fails, a rule-based reader looks for
 * the usual section headings and date ranges.
 *
 * Every entry returned satisfies the Technician schema (education needs an
 * institution and a qualification; experience needs a title, a company and a
 * start date), so the result can be saved as it is.
 */

const pdfParse = require('pdf-parse/lib/pdf-parse.js'); // the package index runs a self-test
const mammoth = require('mammoth');

const PDF = 'application/pdf';
const CV_MODEL = process.env.CV_PARSER_MODEL || 'claude-opus-5-5';

// ─── Text extraction ────────────────────────────────────────
const extractText = async (buffer, mimetype) => {
  if (mimetype === PDF) return (await pdfParse(buffer)).text || '';
  return (await mammoth.extractRawText({ buffer })).value || '';
};

// ─── Dates ──────────────────────────────────────────────────
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const DATE = `(?:${MONTH}\\s*,?\\s*\\d{4}|\\d{1,2}[/.-]\\d{4}|\\d{4})`;
const END = `(?:${DATE}|present|current|now|to date|date|ongoing)`;
const RANGE_RE = new RegExp(`(${DATE})\\s*(?:-|–|—|to|until)\\s*(${END})`, 'i');
const YEAR_RE = /\b(19[5-9]\d|20\d{2})\b/;

// "Mar 2019", "03/2019", "2019" or "2019-03" → Date (first of the month)
const toDate = (s) => {
  if (!s) return null;
  const str = String(s).trim().toLowerCase();
  let m = str.match(/^(\d{4})-(\d{1,2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, 1));
  m = str.match(/^(\d{1,2})[/.-](\d{4})/);
  if (m) return new Date(Date.UTC(+m[2], +m[1] - 1, 1));
  m = str.match(/([a-z]{3})[a-z]*\.?\s*,?\s*(\d{4})/);
  if (m && MONTHS.includes(m[1])) return new Date(Date.UTC(+m[2], MONTHS.indexOf(m[1]), 1));
  m = str.match(YEAR_RE);
  return m ? new Date(Date.UTC(+m[1], 0, 1)) : null;
};
const isOngoing = (s) => /present|current|now|to date|^date$|ongoing/i.test(String(s || ''));

// ─── Rule-based reader ──────────────────────────────────────
const HEADINGS = {
  summary: /^(professional\s+)?(summary|profile|about( me)?|objective|career objective|personal statement)$/i,
  experience: /^(work|professional|employment|relevant|career)?\s*(experience|history|employment)( history)?$/i,
  education: /^(education|academic|academics|education and training|qualifications|academic qualifications|training)( background| history)?$/i,
  skills: /^(key\s+|technical\s+|core\s+)?(skills|competencies|expertise|skills and abilities)$/i,
  other: /^(references|referees|hobbies|interests|languages|certifications|certificates|awards|achievements|projects|personal (details|information)|contacts?)$/i,
};

const splitSections = (text) => {
  const sections = { header: [] };
  let current = 'header';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    const bare = line.replace(/[:\-–_•*]+$/, '').trim();
    const heading = bare.length <= 40 && Object.keys(HEADINGS).find((k) => HEADINGS[k].test(bare));
    if (heading) {
      current = heading;
      sections[current] = sections[current] || [];
      continue;
    }
    // Bullets are kept as "• " so entries can tell description lines from titles
    (sections[current] = sections[current] || []).push(line.replace(/^[•▪●◦*\-–]\s*/, '• '));
  }
  return sections;
};

const BULLET = /^• /;
const unbullet = (l) => l.replace(BULLET, '');

// Group lines into entries: a new entry starts at each line with a date
const entriesByDates = (lines = []) => {
  const entries = [];
  let cur = null;
  lines.forEach((line) => {
    const range = line.match(RANGE_RE);
    const year = !range && line.length < 80 && line.match(YEAR_RE);
    if (range || year) {
      const rest = line.replace(range ? range[0] : year[0], '').replace(/^[\s,|–—-]+|[\s,|–—-]+$/g, '');
      // A line holding only dates has its title (and company) above it: take
      // back up to two non-bullet lines from the end of the previous entry
      const above = [];
      if (!rest && cur) {
        const keep = cur.range || cur.year ? 1 : 0;
        while (above.length < 2 && cur.lines.length > keep && !BULLET.test(cur.lines.at(-1))) {
          above.unshift(cur.lines.pop());
        }
      }
      cur = { range, year: year && year[1], lines: [...above, ...(rest ? [rest] : [])] };
      entries.push(cur);
    } else if (cur) {
      cur.lines.push(line);
    } else {
      cur = { lines: [line] };
      entries.push(cur);
    }
  });
  return entries
    .filter((e) => e.range || e.year)
    .map((e) => ({ ...e, lines: e.lines.map(unbullet).filter(Boolean) }));
};

// "Electrician at Kenya Power", "Electrician | Kenya Power", "Electrician, Kenya Power"
const splitTitleCompany = (lines) => {
  const [first = '', second = ''] = lines;
  const m = first.match(/^(.+?)(?:\s+(?:at|@|\||–|—|-)|\s*,)\s+(.+)$/i);
  if (m) return { title: m[1], company: m[2], rest: lines.slice(1) };
  return { title: first, company: second, rest: lines.slice(2) };
};

const DEGREE_RE = /(ph\.?d|doctor|master|msc|m\.sc|mba|bachelor|b\.?sc|b\.?a\b|b\.?ed|b\.?com|b\.?tech|degree|higher diploma|diploma|certificate|craft|artisan|kcse|kcpe|k\.c\.s\.e|o-level|a-level|grade|nita|apprentice)/i;
const SCHOOL_RE = /(university|college|polytechnic|institute|school|academy|technical|vocational|tti|centre|center)/i;

const ruleBasedParse = (text) => {
  const s = splitSections(text);

  const experience = entriesByDates(s.experience).map((e) => {
    const { title, company, rest } = splitTitleCompany(e.lines);
    const start = toDate(e.range ? e.range[1] : e.year);
    const ongoing = e.range && isOngoing(e.range[2]);
    return {
      title: title.slice(0, 120),
      company: company.slice(0, 120),
      startDate: start,
      endDate: e.range && !ongoing ? toDate(e.range[2]) : null,
      isCurrent: !!ongoing,
      description: rest.join(' ').slice(0, 1000),
    };
  });

  const education = entriesByDates(s.education).map((e) => {
    // "Certificate in Plumbing, Thika Technical Institute" on one line → two parts
    const lines = e.lines.flatMap((l) => (DEGREE_RE.test(l) && SCHOOL_RE.test(l) ? l.split(/\s*[,|–—]\s+/) : [l]));
    const degree = lines.find((l) => DEGREE_RE.test(l)) || lines[0] || '';
    const institution = lines.find((l) => l !== degree && SCHOOL_RE.test(l))
      || lines.find((l) => l !== degree) || '';
    const ongoing = e.range && isOngoing(e.range[2]);
    return {
      degree: degree.slice(0, 150),
      institution: institution.slice(0, 150),
      startDate: e.range ? toDate(e.range[1]) : null,
      endDate: e.range ? (ongoing ? null : toDate(e.range[2])) : toDate(e.year),
      isCurrent: !!ongoing,
    };
  });

  const skills = (s.skills || [])
    .flatMap((l) => l.split(/[,;|•·]/))
    .map((x) => x.trim())
    .filter((x) => x.length > 1 && x.length <= 50);

  return {
    aboutMe: (s.summary || []).map(unbullet).join(' ').slice(0, 2000),
    profileHeadline: '',
    skills,
    experience,
    education,
  };
};

// ─── Claude reader ──────────────────────────────────────────
const str = { type: 'string' };
const CV_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['profileHeadline', 'aboutMe', 'yearsOfExperience', 'skills', 'experience', 'education'],
  properties: {
    profileHeadline: str,
    aboutMe: str,
    yearsOfExperience: { type: 'integer' },
    skills: { type: 'array', items: str },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'company', 'location', 'startDate', 'endDate', 'isCurrent', 'description'],
        properties: {
          title: str, company: str, location: str,
          startDate: str, endDate: str, isCurrent: { type: 'boolean' }, description: str,
        },
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['institution', 'degree', 'fieldOfStudy', 'startDate', 'endDate', 'isCurrent', 'grade'],
        properties: {
          institution: str, degree: str, fieldOfStudy: str,
          startDate: str, endDate: str, isCurrent: { type: 'boolean' }, grade: str,
        },
      },
    },
  },
};

const CV_PROMPT = `This is a CV uploaded by a service expert (a technician, tradesperson or other professional) signing up on a Kenyan marketplace. Fill in their profile from it.

- profileHeadline: one short line saying what they do, e.g. "Certified electrician with 8 years of experience". Under 120 characters.
- aboutMe: their summary or profile paragraph, lightly tidied, in the first person. If the CV has none, write two or three sentences from what it shows. Under 1000 characters.
- yearsOfExperience: total years of work in their field, as a whole number; 0 if it cannot be told.
- skills: their skills and tools, each a few words at most, at most 20.
- experience: every job, newest first. Dates as "YYYY-MM" (or "YYYY" when only the year is given); endDate "" and isCurrent true for a job they still hold. Use "" for anything the CV does not say.
- education: every school, college or training course, newest first, same date format. degree is the qualification (e.g. "Diploma in Electrical Engineering", "KCSE").

Only use what the CV says; never invent employers, schools or dates.`;

const claudeParse = async (buffer, mimetype, text) => {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  const cvBlock = mimetype === PDF
    ? { type: 'document', source: { type: 'base64', media_type: PDF, data: buffer.toString('base64') } }
    : { type: 'text', text: `CV:\n\n${text}` };

  const response = await client.beta.messages.create({
    model: CV_MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: CV_SCHEMA } },
    messages: [{ role: 'user', content: [cvBlock, { type: 'text', text: CV_PROMPT }] }],
  });
  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
    throw new Error(`CV parse stopped: ${response.stop_reason}`);
  }
  const out = response.content.find((b) => b.type === 'text');
  const data = JSON.parse(out.text);

  return {
    ...data,
    experience: data.experience.map((e) => ({
      ...e,
      startDate: toDate(e.startDate),
      endDate: e.isCurrent ? null : toDate(e.endDate),
    })),
    education: data.education.map((e) => ({
      ...e,
      startDate: toDate(e.startDate),
      endDate: e.isCurrent ? null : toDate(e.endDate),
    })),
  };
};

// ─── Clean-up so every entry passes the schema ──────────────
const clean = (v) => String(v || '').trim();
const tidy = (p) => {
  const seen = new Set();
  return {
    profileHeadline: clean(p.profileHeadline).slice(0, 200),
    aboutMe: clean(p.aboutMe).slice(0, 2000),
    yearsOfExperience: Math.max(0, Math.min(60, parseInt(p.yearsOfExperience, 10) || 0)),
    skills: (p.skills || [])
      .map(clean)
      .filter((n) => n && !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase()))
      .slice(0, 20)
      .map((name) => ({ name, level: 'Intermediate' })),
    experience: (p.experience || [])
      .filter((e) => clean(e.title) && clean(e.company) && e.startDate)
      .slice(0, 15)
      .map((e) => ({
        title: clean(e.title), company: clean(e.company), location: clean(e.location),
        startDate: e.startDate, endDate: e.endDate || undefined, isCurrent: !!e.isCurrent,
        description: clean(e.description),
      })),
    education: (p.education || [])
      .filter((e) => clean(e.institution) && clean(e.degree))
      .slice(0, 10)
      .map((e) => ({
        institution: clean(e.institution), degree: clean(e.degree), fieldOfStudy: clean(e.fieldOfStudy),
        startDate: e.startDate || undefined, endDate: e.endDate || undefined, isCurrent: !!e.isCurrent,
        grade: clean(e.grade),
      })),
  };
};

// Years between the earliest job start and today (or the last job end)
const yearsFromExperience = (experience) => {
  const starts = experience.map((e) => e.startDate?.getTime()).filter(Boolean);
  if (!starts.length) return 0;
  const ends = experience.map((e) => (e.isCurrent ? Date.now() : e.endDate?.getTime() || e.startDate.getTime()));
  return Math.floor((Math.max(...ends) - Math.min(...starts)) / (365.25 * 24 * 3600 * 1000));
};

/**
 * @param {Buffer} buffer
 * @param {string} mimetype  application/pdf or .docx
 * @returns {Promise<{profileHeadline, aboutMe, yearsOfExperience, skills, experience, education, source}>}
 */
exports.parseCv = async (buffer, mimetype) => {
  const text = await extractText(buffer, mimetype).catch(() => '');

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return { ...tidy(await claudeParse(buffer, mimetype, text)), source: 'ai' };
    } catch (err) {
      console.error('CV parse with Claude failed, using the rule-based reader:', err.message);
    }
  }

  const parsed = tidy(ruleBasedParse(text));
  parsed.yearsOfExperience = yearsFromExperience(parsed.experience);
  return { ...parsed, source: 'rules' };
};
