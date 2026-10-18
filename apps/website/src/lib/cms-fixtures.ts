/**
 * Sample content served while the API's cms module does not exist yet
 * (WEBSITE_DATA_SOURCE=mock). Everything here is synthetic demo data, validated by the same zod
 * schemas as live API responses (see cms-client.test.ts), so swapping to the API changes no types.
 */
import type {
  CmsEvent,
  CmsImage,
  CmsPage,
  GalleryItem,
  HomeContent,
  Notice,
  SiteProfile,
} from "@/lib/cms-types.ts";

const image = (name: string, alt: string, width = 1200, height = 800): CmsImage => ({
  src: `/images/${name}.jpg`,
  alt,
  width,
  height,
});

export const siteFixture: SiteProfile = {
  name: "Green Valley Public School",
  shortName: "Green Valley",
  tagline: "Curious minds. Kind hearts. Confident futures.",
  description:
    "Green Valley Public School is a CBSE-affiliated day school for Nursery to Class XII, with small classes, strong academics and a caring community.",
  timezone: "Asia/Kolkata",
  theme: { primaryColor: "#0f766e", font: "nunito-sans" },
  contact: {
    street: "12 Orchard Road, Sector 21",
    city: "Bengaluru",
    region: "Karnataka",
    postalCode: "560001",
    country: "IN",
    phone: "+91 80 4000 1234",
    email: "office@greenvalley.example.com",
    hours: "Mon–Fri 8:30–16:30, Sat 9:00–13:00",
  },
  social: [
    { label: "Facebook", href: "https://facebook.com/greenvalley.example" },
    { label: "Instagram", href: "https://instagram.com/greenvalley.example" },
    { label: "YouTube", href: "https://youtube.com/@greenvalley.example" },
  ],
  admissions: { open: true, academicYear: "2027–28", deadline: "2027-02-28" },
};

export const homeFixture: HomeContent = {
  hero: {
    eyebrow: "Admissions open for 2027–28",
    heading: "A school where every child is known by name",
    subheading:
      "Small classes, inspiring teachers and a campus built for curiosity, from Nursery to Class XII.",
    image: image("hero", "Students walking across the Green Valley campus", 1920, 1080),
    primaryCta: { label: "Apply for admission", href: "/admissions" },
    secondaryCta: { label: "Book a campus visit", href: "/contact" },
  },
  stats: [
    { label: "Students", value: 1850, suffix: "+" },
    { label: "Expert teachers", value: 96 },
    { label: "Years of excellence", value: 28 },
    { label: "Board pass rate", value: 99, suffix: "%" },
  ],
  testimonials: [
    {
      id: "t1",
      quote:
        "My daughter walks into school excited every morning. Her teachers noticed her love of science early and nurtured it.",
      author: "Priya Nair",
      role: "Parent, Class VI",
    },
    {
      id: "t2",
      quote:
        "The fee and attendance updates on the parent portal save me hours, and I always know how my son is doing.",
      author: "Rahul Mehta",
      role: "Parent, Class III",
    },
    {
      id: "t3",
      quote:
        "From robotics club to the debate team, Green Valley gave me the confidence to try everything. I'm now studying engineering.",
      author: "Ananya Rao",
      role: "Alumna, Batch of 2024",
    },
  ],
};

const body = (text: string): string => `<p>${text}</p>`;

export const noticeFixtures: Notice[] = [
  {
    slug: "admissions-open-2027-28",
    title: "Admissions open for the 2027–28 academic year",
    summary: "Applications for Nursery to Class IX are now open. Apply online before 28 February.",
    category: "admission",
    publishedAt: "2026-10-05T09:00:00+05:30",
    pinned: true,
    bodyHtml:
      body(
        "Applications for <strong>Nursery to Class IX</strong> are open for the 2027–28 academic year. Please complete the online enquiry form and our admissions team will contact you within two working days.",
      ) +
      body("Campus tours run every Saturday between 10:00 and 12:00. No appointment is needed."),
  },
  {
    slug: "half-yearly-exam-schedule",
    title: "Half-yearly examination schedule published",
    summary: "Examinations for Classes VI–XII begin on 17 November. Timetables are on the portal.",
    category: "exam",
    publishedAt: "2026-10-12T08:30:00+05:30",
    pinned: true,
    bodyHtml: body(
      "The half-yearly examinations for Classes VI to XII begin on <strong>17 November</strong>. Detailed timetables and seating plans are available on the parent portal.",
    ),
  },
  {
    slug: "diwali-holidays",
    title: "School closed for Diwali holidays",
    summary:
      "The school remains closed from 30 October to 3 November. Classes resume on 4 November.",
    category: "holiday",
    publishedAt: "2026-10-14T10:00:00+05:30",
    pinned: false,
    bodyHtml: body(
      "The school will remain closed from <strong>30 October to 3 November</strong> for Diwali. Classes resume on Tuesday, 4 November. We wish every family a safe and joyful festival.",
    ),
  },
  {
    slug: "parent-teacher-meeting",
    title: "Parent–teacher meeting on 8 November",
    summary: "Meet your child's class teacher between 9:00 and 13:00. Slots can be booked online.",
    category: "academic",
    publishedAt: "2026-10-15T11:15:00+05:30",
    pinned: false,
    bodyHtml: body(
      "Our term parent–teacher meeting takes place on <strong>Saturday, 8 November</strong> from 9:00 to 13:00. Please bring your child's diary.",
    ),
  },
  {
    slug: "school-bus-routes-update",
    title: "Updated school bus routes from 1 November",
    summary: "Two new pick-up points have been added on the north and east routes.",
    category: "general",
    publishedAt: "2026-10-16T07:45:00+05:30",
    pinned: false,
    bodyHtml: body(
      "From 1 November, two pick-up points are added to the north and east routes. The updated route list is available at the front office.",
    ),
  },
];

export const eventFixtures: CmsEvent[] = [
  {
    slug: "annual-day-2026",
    title: "Annual Day celebration",
    summary: "An evening of music, drama and dance by our students.",
    startsAt: "2026-12-12T17:30:00+05:30",
    endsAt: "2026-12-12T20:30:00+05:30",
    location: "School auditorium",
    image: image("gallery-2", "Students performing on stage at the annual day"),
    bodyHtml: body(
      "Join us for our Annual Day, an evening of music, drama and dance by students from every class. All families are welcome.",
    ),
  },
  {
    slug: "science-exhibition",
    title: "Inter-school science exhibition",
    summary: "Student projects on sustainability and everyday engineering.",
    startsAt: "2026-11-21T09:30:00+05:30",
    endsAt: "2026-11-21T15:00:00+05:30",
    location: "Science block",
    image: image("gallery-3", "Students presenting a science project"),
    bodyHtml: body(
      "Students from twelve schools present working models on sustainability, energy and everyday engineering. Open to visitors.",
    ),
  },
  {
    slug: "sports-day",
    title: "Sports Day",
    summary: "Track and field events, relay races and team games for all houses.",
    startsAt: "2027-01-17T08:00:00+05:30",
    location: "Main playground",
    image: image("gallery-4", "Students running a relay race"),
    bodyHtml: body(
      "Our annual Sports Day features track and field events, relay races and team games across all four houses.",
    ),
  },
  {
    slug: "open-house",
    title: "Admissions open house",
    summary: "Meet our teachers, tour the campus and ask us anything.",
    startsAt: "2026-11-01T10:00:00+05:30",
    endsAt: "2026-11-01T12:00:00+05:30",
    location: "Main campus",
    bodyHtml: body(
      "Prospective families are invited to tour the campus, meet teachers and learn about the admissions process.",
    ),
  },
];

export const galleryFixtures: GalleryItem[] = [
  {
    id: "g1",
    ...image("gallery-1", "Children reading together in the school library"),
    caption: "Library hour",
  },
  {
    id: "g2",
    ...image("gallery-2", "Students performing on stage at the annual day"),
    caption: "Annual Day",
  },
  {
    id: "g3",
    ...image("gallery-3", "Students presenting a science project"),
    caption: "Science exhibition",
  },
  {
    id: "g4",
    ...image("gallery-4", "Students running a relay race"),
    caption: "Sports Day",
  },
  {
    id: "g5",
    ...image("gallery-5", "Art class painting in the studio"),
    caption: "Art studio",
  },
  {
    id: "g6",
    ...image("gallery-6", "Students working on robots in the computer lab"),
    caption: "Robotics club",
  },
];

export const pageFixtures: CmsPage[] = [
  {
    slug: "about",
    title: "About us",
    description: "Our story, our values and the people who make Green Valley a place to grow.",
    updatedAt: "2026-09-20T10:00:00+05:30",
    blocks: [
      {
        type: "hero",
        id: "about-hero",
        heading: "28 years of nurturing curious minds",
        subheading:
          "Founded in 1998, Green Valley has grown from 60 students to a community of nearly 2,000.",
        image: image("hero", "The Green Valley campus", 1920, 1080),
      },
      {
        type: "rich-text",
        id: "about-story",
        html:
          "<h2>Our story</h2>" +
          body(
            "Green Valley began with a simple belief: children learn best when they are known, challenged and encouraged. That belief still shapes every classroom.",
          ) +
          body(
            "Today we teach <strong>Nursery to Class XII</strong> under the CBSE curriculum, with small classes, qualified teachers and a strong focus on well-being.",
          ),
      },
      {
        type: "columns",
        id: "about-values",
        columns: [
          {
            heading: "Learn",
            html: body("Rigorous academics that build understanding, not just marks."),
          },
          {
            heading: "Grow",
            html: body("Sports, arts, clubs and service that develop the whole child."),
          },
          {
            heading: "Belong",
            html: body("A safe, inclusive community where every family is welcome."),
          },
        ],
      },
      {
        type: "cta",
        id: "about-cta",
        heading: "Come and see Green Valley",
        body: "Visit our campus any Saturday morning, or book a time that suits you.",
        button: { label: "Book a campus visit", href: "/contact" },
      },
    ],
  },
  {
    slug: "admissions",
    title: "Admissions",
    description: "How to apply to Green Valley Public School for Nursery to Class XII.",
    updatedAt: "2026-10-05T09:00:00+05:30",
    blocks: [
      {
        type: "rich-text",
        id: "adm-steps",
        html:
          "<h2>How admissions work</h2><ol>" +
          "<li>Send an enquiry using the form below.</li>" +
          "<li>Our admissions team calls you within two working days.</li>" +
          "<li>Visit the campus and meet the class teacher.</li>" +
          "<li>Complete the application and submit documents.</li></ol>",
      },
      {
        type: "faq",
        id: "adm-faq",
        heading: "Frequently asked questions",
        items: [
          {
            question: "Which classes are open for admission?",
            answerHtml: body(
              "Nursery to Class IX are open for 2027–28, subject to seat availability.",
            ),
          },
          {
            question: "Which documents do I need?",
            answerHtml: body(
              "A birth certificate, the previous school's transfer certificate (Class I and above), report cards and address proof.",
            ),
          },
          {
            question: "Is there an entrance assessment?",
            answerHtml: body(
              "Classes Nursery to II have an informal interaction. Classes III and above have a short assessment in English and mathematics.",
            ),
          },
        ],
      },
    ],
  },
  {
    slug: "facilities",
    title: "Campus and facilities",
    description: "Libraries, laboratories, sports grounds and studios on our 6-acre campus.",
    updatedAt: "2026-09-02T10:00:00+05:30",
    blocks: [
      {
        type: "rich-text",
        id: "fac-intro",
        html:
          "<h2>A campus built for learning</h2>" +
          body(
            "Our 6-acre campus includes well-stocked libraries, science and computer laboratories, art and music studios, and sports grounds for athletics, cricket and football.",
          ),
      },
      {
        type: "gallery",
        id: "fac-gallery",
        heading: "Around the campus",
        images: galleryFixtures.map(({ src, alt, width, height }) => ({ src, alt, width, height })),
      },
      {
        type: "image",
        id: "fac-image",
        image: image("gallery-1", "Children reading together in the school library"),
        caption: "The junior library has over 8,000 books.",
      },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy policy",
    description: "How Green Valley collects, uses and protects personal information.",
    updatedAt: "2026-08-01T10:00:00+05:30",
    blocks: [
      {
        type: "rich-text",
        id: "privacy-body",
        html:
          "<h2>Your information</h2>" +
          body(
            "We collect only the information we need to run the school and to respond to your enquiries. We do not sell personal information.",
          ) +
          body(
            'To exercise your rights, write to <a href="mailto:office@greenvalley.example.com">office@greenvalley.example.com</a>.',
          ),
      },
    ],
  },
];
