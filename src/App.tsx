import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Filter,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { api as supabase } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Job,
  Task,
  Event,
  Application,
  Profile,
  Message,
} from "@/types/models";

type Page =
  | "overview"
  | "explore"
  | "applications"
  | "planner"
  | "community"
  | "messages"
  | "profile";
type Modal = "auth" | "task" | "event" | "job" | "apply" | "post" | null;
type CommunityPost = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  topic: string;
  created_at: string;
  author?: string;
};

const demoJobs: Job[] = [
  {
    id: "demo-1",
    title: "Senior Product Designer",
    company: "Linear",
    location: "Remote · Worldwide",
    job_type: "Contract",
    salary: "$80–120 / hr",
    category: "Design",
    description:
      "Shape thoughtful product experiences for teams who care deeply about craft. You will own research, interaction design and polished UI from idea to launch.",
    skills: ["Figma", "Product Design", "Design Systems"],
    recruiter_id: null,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: null,
    budget_min: 80,
    budget_max: 120,
    application_count: 24,
    application_instructions: null,
    deadline: null,
    requirements: null,
    visibility: "public",
  },
  {
    id: "demo-2",
    title: "Full Stack Developer",
    company: "Vercel",
    location: "Remote · US / EU",
    job_type: "Project",
    salary: "$6k–10k / project",
    category: "Development",
    description:
      "Build a fast, accessible web application with React, TypeScript and a robust API. We value clean code and clear communication.",
    skills: ["React", "TypeScript", "Node.js"],
    recruiter_id: null,
    status: "active",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: null,
    budget_min: 6000,
    budget_max: 10000,
    application_count: 18,
    application_instructions: null,
    deadline: null,
    requirements: null,
    visibility: "public",
  },
  {
    id: "demo-3",
    title: "Brand Identity & Website",
    company: "Arc Studio",
    location: "Remote · Flexible",
    job_type: "Contract",
    salary: "$4k–7k / project",
    category: "Branding",
    description:
      "Create a memorable identity and responsive website for a growing creative studio. Strong typography and visual storytelling are essential.",
    skills: ["Branding", "Web Design", "Figma"],
    recruiter_id: null,
    status: "active",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: null,
    budget_min: 4000,
    budget_max: 7000,
    application_count: 12,
    application_instructions: null,
    deadline: null,
    requirements: null,
    visibility: "public",
  },
  {
    id: "demo-4",
    title: "Content Strategist",
    company: "Notion",
    location: "Remote · Anywhere",
    job_type: "Part-time",
    salary: "$55–85 / hr",
    category: "Writing",
    description:
      "Help a global audience get more from their tools through clear, useful editorial content and thoughtful campaigns.",
    skills: ["Content", "SEO", "Strategy"],
    recruiter_id: null,
    status: "active",
    created_at: new Date(Date.now() - 260000000).toISOString(),
    updated_at: null,
    budget_min: 55,
    budget_max: 85,
    application_count: 31,
    application_instructions: null,
    deadline: null,
    requirements: null,
    visibility: "public",
  },
];
const today = new Date();
const localDate = (d: Date) =>
  [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
const dateAfter = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localDate(d);
};
const demoTasks: Task[] = [
  {
    id: "demo-task-1",
    title: "Send proposal to Arc Studio",
    description: null,
    due_date: dateAfter(0),
    priority: "high",
    project: "Arc Studio",
    status: "todo",
    user_id: "demo",
    created_at: null,
    updated_at: null,
  },
  {
    id: "demo-task-2",
    title: "Review portfolio case study",
    description: null,
    due_date: dateAfter(1),
    priority: "medium",
    project: "Portfolio",
    status: "in-progress",
    user_id: "demo",
    created_at: null,
    updated_at: null,
  },
  {
    id: "demo-task-3",
    title: "Prepare for client call",
    description: null,
    due_date: dateAfter(2),
    priority: "low",
    project: "Client work",
    status: "todo",
    user_id: "demo",
    created_at: null,
    updated_at: null,
  },
];
const demoPosts: CommunityPost[] = [
  {
    id: "demo-post-1",
    author_id: "demo",
    author: "Alex Morgan",
    title: "Looking for a developer to collaborate on a climate project",
    body: "I’m designing a small platform that helps local communities track their environmental impact. Looking for a React developer who enjoys building things that matter.",
    topic: "Collaboration",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "demo-post-2",
    author_id: "demo",
    author: "Priya Shah",
    title: "What helped you land your first freelance client?",
    body: "Sharing the small things that made a difference for me: a focused portfolio, personal outreach, and asking thoughtful questions. What worked for you?",
    topic: "Discussion",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];
const initialDemoTasks = () => {
  try {
    const raw = localStorage.getItem("skillspace_demo_tasks");
    const parsed = raw ? JSON.parse(raw) : demoTasks;
    return Array.isArray(parsed) ? parsed : demoTasks;
  } catch {
    return demoTasks;
  }
};
const initialDemoPosts = () => {
  try {
    const raw = localStorage.getItem("skillspace_demo_posts");
    const parsed = raw ? JSON.parse(raw) : demoPosts;
    return Array.isArray(parsed) ? parsed : demoPosts;
  } catch {
    return demoPosts;
  }
};
const fmtDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "No date";
const initials = (name: string) =>
  name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const nav: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: "overview", label: "Overview", icon: LayoutDashboard },
  { page: "explore", label: "Explore jobs", icon: Compass },
  { page: "applications", label: "Applications", icon: BriefcaseBusiness },
  { page: "planner", label: "My planner", icon: CalendarDays },
  { page: "community", label: "Community", icon: Users },
  { page: "messages", label: "Messages", icon: MessageCircle },
];

function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const [page, setPage] = useState<Page>(
    () => (location.hash.replace("#/", "") as Page) || "overview",
  );
  const [modal, setModal] = useState<Modal>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(demoJobs);
  const [tasks, setTasks] = useState<Task[]>(initialDemoTasks);
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>(initialDemoPosts);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem("skillspace_saved") || "[]",
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(localDate(new Date()));
  const [taskForm, setTaskForm] = useState({
    title: "",
    due_date: localDate(new Date()),
    priority: "medium",
    project: "",
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    date: localDate(new Date()),
    time: "10:00",
    description: "",
  });
  const [postForm, setPostForm] = useState({
    title: "",
    body: "",
    topic: "Discussion",
  });
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    description: "",
    location: "Remote",
    job_type: "Contract",
    category: "Development",
    salary: "",
    skills: "",
  });
  const [coverLetter, setCoverLetter] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "freelancer",
  });
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    title: "",
    location: "",
    bio: "",
    skills: "",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState("");
  const [messageText, setMessageText] = useState("");
  const [people, setPeople] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<Application[]>([]);
  const [applicantNames, setApplicantNames] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const onHash = () =>
      setPage((location.hash.replace("#/", "") as Page) || "overview");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    localStorage.setItem("skillspace_saved", JSON.stringify(saved));
  }, [saved]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!user) {
        setJobs(demoJobs);
        setTasks(initialDemoTasks());
        setPosts(initialDemoPosts());
        setEvents([]);
        setApplications([]);
        setIncoming([]);
        setMessages([]);
        setProfile(null);
        const [publicJobs, publicPosts] = await Promise.all([
          supabase
            .from("jobs")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false }),
          (supabase as any)
            .from("community_posts")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);
        if (alive && !publicJobs.error) setJobs(publicJobs.data || []);
        if (alive && !publicPosts.error) setPosts(publicPosts.data || []);
        return;
      }
      setJobs([]);
      setTasks([]);
      setPosts([]);
      setEvents([]);
      setApplications([]);
      setIncoming([]);
      setMessages([]);
      const results = await Promise.all([
        supabase
          .from("jobs")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("due_date", { ascending: true }),
        supabase
          .from("calendar_events")
          .select("*")
          .eq("user_id", user.id)
          .order("start_time", { ascending: true }),
        supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("chat_messages")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: true }),
        supabase.from("profiles").select("*").neq("id", user.id).limit(30),
        (supabase as any)
          .from("community_posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (!alive) return;
      if (!results[0].error) setJobs(results[0].data || []);
      else {
        setJobs([]);
        announce("Could not load live jobs. Check the API connection.");
      }
      if (!results[1].error) setTasks(results[1].data || []);
      if (!results[2].error) setEvents(results[2].data || []);
      if (!results[3].error) setApplications(results[3].data || []);
      if (!results[4].error) {
        let p = results[4].data;
        if (!p) {
          const created = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              full_name:
                user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "Member",
              user_type: user.user_metadata?.user_type || "freelancer",
            })
            .select()
            .single();
          if (!created.error) p = created.data;
        }
        setProfile(p);
        if (p)
          setProfileForm({
            full_name: p.full_name,
            title: p.title || "",
            location: p.location || "",
            bio: p.bio || "",
            skills: (p.skills || []).join(", "),
          });
      }
      if (!results[5].error) setMessages(results[5].data || []);
      if (!results[6].error) setPeople(results[6].data || []);
      if (!results[7].error) setPosts(results[7].data || []);
      else setPosts([]);
      const ownIds = (results[0].data || [])
        .filter((job: Job) => job.recruiter_id === user.id)
        .map((job: Job) => job.id);
      if (ownIds.length) {
        const received = await supabase
          .from("job_applications")
          .select("*")
          .in("job_id", ownIds)
          .order("created_at", { ascending: false });
        if (alive && !received.error) {
          setIncoming(received.data || []);
          const ids = Array.from(
            new Set(
              (received.data || []).map(
                (application: Application) => application.user_id,
              ),
            ),
          );
          if (ids.length) {
            const applicants = await supabase
              .from("profiles")
              .select("*")
              .in("id", ids);
            if (alive && !applicants.error)
              setApplicantNames(
                Object.fromEntries(
                  (applicants.data || []).map((person: Profile) => [
                    person.id,
                    person.full_name,
                  ]),
                ),
              );
          }
        }
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [user]);
  const go = (next: Page) => {
    location.hash = "/" + next;
    setPage(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const announce = (value: string) => setNotice(value);
  const requireUser = () => {
    if (user) return true;
    setAuthMode("signin");
    setModal("auth");
    announce("Sign in to save your work across devices.");
    return false;
  };
  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || "Creative explorer";
  const firstName = displayName.split(" ")[0];
  const filteredJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (category === "All" || j.category === category) &&
          `${j.title} ${j.company} ${j.description} ${j.skills?.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [jobs, query, category],
  );
  const categories = [
    "All",
    ...Array.from(new Set(jobs.map((j) => j.category).filter(Boolean))),
  ];
  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const upcomingEvents = events
    .filter((e) => e.start_time >= new Date().toISOString())
    .slice(0, 3);
  const appliedIds = new Set(applications.map((a) => a.job_id));
  const selectedDateEvents = events.filter(
    (e) => localDate(new Date(e.start_time)) === selectedDate,
  );
  const selectedDateTasks = tasks.filter(
    (t) => t.due_date?.slice(0, 10) === selectedDate,
  );
  const myPosts = posts.map((p) => ({
    ...p,
    author:
      p.author ||
      (p.author_id === user?.id
        ? displayName
        : people.find((x) => x.id === p.author_id)?.full_name ||
          "Community member"),
  }));
  const openJob = (job: Job) => {
    setSelectedJob(job);
    setModal("job");
  };
  const toggleSaved = (id: string) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const createTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setBusy(true);
    const input = {
      title: taskForm.title.trim(),
      due_date: taskForm.due_date || null,
      priority: taskForm.priority,
      status: "todo",
      project: taskForm.project || null,
      user_id: user?.id || "demo",
    };
    if (user) {
      const { data, error } = await supabase
        .from("tasks")
        .insert(input)
        .select()
        .single();
      if (error) announce(error.message);
      else {
        setTasks((t) => [...t, data]);
        setModal(null);
        announce("Task added to your planner.");
      }
    } else {
      setTasks((t) => {
        const next = [
          ...t,
          {
            ...input,
            id: crypto.randomUUID(),
            description: null,
            created_at: new Date().toISOString(),
            updated_at: null,
          },
        ];
        localStorage.setItem("skillspace_demo_tasks", JSON.stringify(next));
        return next;
      });
      setModal(null);
      announce("Task added to your demo planner.");
    }
    setTaskForm({
      title: "",
      due_date: localDate(new Date()),
      priority: "medium",
      project: "",
    });
    setBusy(false);
  };
  const toggleTask = async (task: Task) => {
    const status = task.status === "completed" ? "todo" : "completed";
    if (user) {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", task.id);
      if (error) {
        announce(error.message);
        return;
      }
    }
    setTasks((t) => {
      const next = t.map((x) => (x.id === task.id ? { ...x, status } : x));
      if (!user)
        localStorage.setItem("skillspace_demo_tasks", JSON.stringify(next));
      return next;
    });
  };
  const deleteTask = async (task: Task) => {
    if (user) {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) {
        announce(error.message);
        return;
      }
    }
    setTasks((t) => {
      const next = t.filter((x) => x.id !== task.id);
      if (!user)
        localStorage.setItem("skillspace_demo_tasks", JSON.stringify(next));
      return next;
    });
    announce("Task removed.");
  };
  const createEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireUser()) return;
    const start = new Date(`${eventForm.date}T${eventForm.time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setBusy(true);
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        title: eventForm.title.trim(),
        description: eventForm.description || null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        event_type: "meeting",
        is_all_day: false,
        user_id: user!.id,
        location: null,
      })
      .select()
      .single();
    if (error) announce(error.message);
    else {
      setEvents((v) => [...v, data]);
      setModal(null);
      announce("Event added to your calendar.");
    }
    setBusy(false);
  };
  const applyJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !requireUser()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        job_id: selectedJob.id,
        user_id: user!.id,
        cover_letter: coverLetter.trim(),
        status: "applied",
      })
      .select()
      .single();
    if (error) announce(error.message);
    else {
      setApplications((a) => [data, ...a]);
      setModal(null);
      setCoverLetter("");
      announce("Application sent. Good luck!");
    }
    setBusy(false);
  };
  const changeApplicationStatus = async (
    application: Application,
    status: string,
  ) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", application.id);
    if (error) announce(error.message);
    else {
      setIncoming((items) =>
        items.map((item) =>
          item.id === application.id ? { ...item, status } : item,
        ),
      );
      announce("Application status updated.");
    }
  };
  const createPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.body.trim()) return;
    setBusy(true);
    const input = {
      title: postForm.title.trim(),
      body: postForm.body.trim(),
      topic: postForm.topic,
      author_id: user?.id || "demo",
    };
    if (user) {
      const { data, error } = await (supabase as any)
        .from("community_posts")
        .insert(input)
        .select()
        .single();
      if (error) announce("Community setup is needed: " + error.message);
      else {
        setPosts((p) => [data, ...p]);
        setModal(null);
        announce("Your post is live.");
      }
    } else {
      setPosts((p) => {
        const next = [
          {
            ...input,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            author: "You",
          },
          ...p,
        ];
        localStorage.setItem("skillspace_demo_posts", JSON.stringify(next));
        return next;
      });
      setModal(null);
      announce("Post added to your demo community.");
    }
    setBusy(false);
  };
  const createJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireUser()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        ...jobForm,
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        skills: jobForm.skills
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        recruiter_id: user!.id,
        status: "active",
      })
      .select()
      .single();
    if (error) announce(error.message);
    else {
      setJobs((j) => [data, ...j]);
      setModal(null);
      announce("Job published successfully.");
    }
    setBusy(false);
  };
  const submitAuth = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (authMode === "signin") {
      const { error } = await signIn(authForm.email, authForm.password);
      if (error) announce(error.message);
      else {
        setModal(null);
        announce("Welcome back!");
      }
    } else {
      const { error } = await signUp(authForm.email, authForm.password, {
        full_name: authForm.name,
        user_type: authForm.role,
      });
      if (error) announce(error.message);
      else {
        setModal(null);
        announce("Account created. Welcome to Skill Space!");
      }
    }
    setBusy(false);
  };
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireUser()) return;
    setBusy(true);
    const input = {
      id: user!.id,
      full_name: profileForm.full_name.trim(),
      title: profileForm.title,
      location: profileForm.location,
      bio: profileForm.bio,
      skills: profileForm.skills
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      user_type:
        profile?.user_type || user?.user_metadata?.user_type || "freelancer",
    };
    const { data, error } = await supabase
      .from("profiles")
      .upsert(input)
      .select()
      .single();
    if (error) announce(error.message);
    else {
      setProfile(data);
      announce("Profile saved.");
    }
    setBusy(false);
  };
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireUser() || !recipient || !messageText.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        sender_id: user!.id,
        receiver_id: recipient,
        content: messageText.trim(),
      })
      .select()
      .single();
    if (error) announce(error.message);
    else {
      setMessages((m) => [...m, data]);
      setMessageText("");
    }
    setBusy(false);
  };
  const conversations = people.filter((p) =>
    messages.some((m) => m.sender_id === p.id || m.receiver_id === p.id),
  );
  const selectedPerson = people.find((p) => p.id === recipient);
  const shownMessages = messages.filter(
    (m) =>
      (m.sender_id === user?.id && m.receiver_id === recipient) ||
      (m.receiver_id === user?.id && m.sender_id === recipient),
  );
  const iconSize = 18;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <button
          className="brand"
          onClick={() => go("overview")}
          aria-label="Skillspace home"
        >
          <span className="brand-mark">
            <Sparkles size={19} />
          </span>
          <span>
            skill<span className="brand-accent">space</span>
            <small>YOUR WORK, IN MOTION</small>
          </span>
        </button>
        <div className="workspace-pill">
          <span className="workspace-icon">
            <BriefcaseBusiness size={17} />
          </span>
          <span>
            <strong>My workspace</strong>
            <small>{user ? "Personal account" : "Explore demo"}</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <div className="nav-heading">WORKSPACE</div>
        <nav className="side-nav">
          {nav.map((item) => (
            <button
              key={item.page}
              className={page === item.page ? "nav-item active" : "nav-item"}
              onClick={() => go(item.page)}
            >
              <item.icon size={iconSize} />
              <span>{item.label}</span>
              {item.page === "applications" && applications.length > 0 && (
                <em>{applications.length}</em>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-heading lower">ACCOUNT</div>
        <nav className="side-nav">
          <button
            className={page === "profile" ? "nav-item active" : "nav-item"}
            onClick={() => go("profile")}
          >
            <UserRound size={iconSize} />
            <span>My profile</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-glow">
              <Sparkles size={20} />
            </div>
            <strong>Make your next move</strong>
            <p>Your best work deserves the right opportunity.</p>
            <button onClick={() => go("explore")}>
              Explore opportunities <ArrowRight size={15} />
            </button>
          </div>
          <button
            className="sidebar-help"
            onClick={() => {
              setAuthMode("signin");
              setModal("auth");
            }}
          >
            <ShieldCheck size={16} />
            {user ? "Account connected" : "Sign in to sync your work"}
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {nav.find((n) => n.page === page)?.label || "My profile"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="today-chip">
              <CalendarDays size={15} />
              {today.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <button
              className="icon-button bell-button"
              title="Updates"
              onClick={() => announce("You’re all caught up!")}
            >
              <Bell size={19} />
              <i />
            </button>
            <button
              className="user-chip"
              onClick={() =>
                user ? go("profile") : (setAuthMode("signin"), setModal("auth"))
              }
            >
              <span className="avatar">{initials(displayName)}</span>
              <span>{user ? firstName : "Guest"}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        {!user && !authLoading && (
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              You’re exploring a live demo. Sign in to save tasks, applications,
              and posts across devices.
            </span>
            <button
              onClick={() => {
                setAuthMode("signup");
                setModal("auth");
              }}
            >
              Create an account <ArrowRight size={14} />
            </button>
          </div>
        )}
        <main className="content">
          {page === "overview" && (
            <>
              <div className="page-heading split">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> YOUR WORKSPACE
                  </div>
                  <h1>
                    Good{" "}
                    {new Date().getHours() < 12
                      ? "morning"
                      : new Date().getHours() < 18
                        ? "afternoon"
                        : "evening"}
                    , {firstName}
                    <span className="wave"> ✳</span>
                  </h1>
                  <p>Here’s what’s happening across your work today.</p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => go("explore")}
                >
                  Explore opportunities <ArrowUpRight size={17} />
                </button>
              </div>
              <section className="hero-card">
                <div className="hero-copy">
                  <span className="hero-kicker">
                    <Sparkles size={15} /> YOUR NEXT CHAPTER STARTS HERE
                  </span>
                  <h2>
                    Find work that <em>moves</em> you forward.
                  </h2>
                  <p>
                    Discover projects that match your skills, meet great people,
                    and keep every opportunity on track.
                  </p>
                  <button onClick={() => go("explore")}>
                    Browse open roles <ArrowRight size={17} />
                  </button>
                </div>
                <div className="hero-art">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="hero-disc">
                    <span>✳</span>
                  </div>
                  <div className="float-card float-one">
                    <span className="float-icon">
                      <BriefcaseBusiness size={16} />
                    </span>
                    <span>
                      <strong>New opportunity</strong>
                      <small>Matched for your skills</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </div>
                  <div className="float-card float-two">
                    <span className="float-icon green">
                      <TrendingUp size={16} />
                    </span>
                    <span>
                      <strong>Keep growing</strong>
                      <small>One step at a time</small>
                    </span>
                  </div>
                </div>
              </section>
              <section className="stat-grid">
                <div className="stat-card">
                  <span className="stat-icon purple">
                    <BriefcaseBusiness size={20} />
                  </span>
                  <span className="stat-meta">
                    Applications sent <ArrowUpRight size={16} />
                  </span>
                  <strong>{applications.length}</strong>
                  <small>
                    {user
                      ? "Your total applications"
                      : "Create an account to apply"}
                  </small>
                </div>
                <div className="stat-card">
                  <span className="stat-icon peach">
                    <Target size={20} />
                  </span>
                  <span className="stat-meta">
                    Open tasks <ArrowUpRight size={16} />
                  </span>
                  <strong>{activeTasks.length}</strong>
                  <small>{completedTasks.length} completed so far</small>
                </div>
                <div className="stat-card">
                  <span className="stat-icon blue">
                    <CalendarDays size={20} />
                  </span>
                  <span className="stat-meta">
                    Upcoming events <ArrowUpRight size={16} />
                  </span>
                  <strong>{upcomingEvents.length}</strong>
                  <small>Stay ahead of schedule</small>
                </div>
                <div className="stat-card">
                  <span className="stat-icon green">
                    <Bookmark size={20} />
                  </span>
                  <span className="stat-meta">
                    Saved roles <ArrowUpRight size={16} />
                  </span>
                  <strong>{saved.length}</strong>
                  <small>Opportunities to revisit</small>
                </div>
              </section>
              <div className="overview-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <span className="section-kicker">
                        LATEST OPPORTUNITIES
                      </span>
                      <h3>Explore opportunities</h3>
                    </div>
                    <button className="text-link" onClick={() => go("explore")}>
                      View all <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="mini-jobs">
                    {jobs.slice(0, 3).map((job, i) => (
                      <button
                        className="mini-job"
                        key={job.id}
                        onClick={() => openJob(job)}
                      >
                        <span className={`company-logo logo-${i % 4}`}>
                          {job.company.slice(0, 1)}
                        </span>
                        <span className="mini-job-copy">
                          <strong>{job.title}</strong>
                          <small>
                            {job.company} <b>·</b> {job.location}
                          </small>
                        </span>
                        <span className="mini-job-right">
                          <strong>{job.salary}</strong>
                          <small>{job.job_type}</small>
                        </span>
                        <ArrowUpRight size={16} />
                      </button>
                    ))}
                  </div>
                </section>
                <section className="panel tasks-panel">
                  <div className="panel-head">
                    <div>
                      <span className="section-kicker">STAY ON TRACK</span>
                      <h3>Your priorities</h3>
                    </div>
                    <button
                      className="circle-add"
                      aria-label="Add task"
                      onClick={() => setModal("task")}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {activeTasks.slice(0, 3).map((task) => (
                    <div className="task-row" key={task.id}>
                      <button
                        className="task-check"
                        aria-label="Complete task"
                        onClick={() => toggleTask(task)}
                      >
                        <Check size={14} />
                      </button>
                      <div>
                        <strong>{task.title}</strong>
                        <small>
                          {task.project || "Personal"} ·{" "}
                          {fmtDate(task.due_date)}
                        </small>
                      </div>
                      <span className={`priority ${task.priority}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                  {activeTasks.length === 0 && (
                    <div className="empty-compact">
                      All clear. Add a task to plan your next move.
                    </div>
                  )}
                  <button
                    className="panel-footer-link"
                    onClick={() => go("planner")}
                  >
                    Open planner <ArrowRight size={15} />
                  </button>
                </section>
              </div>
              <div className="bottom-grid">
                <section className="panel insight-panel">
                  <div className="panel-head">
                    <div>
                      <span className="section-kicker">YOUR PROGRESS</span>
                      <h3>Momentum matters</h3>
                    </div>
                    <span className="muted-chip">This month</span>
                  </div>
                  <div className="insight-content">
                    <div
                      className="progress-ring"
                      style={
                        {
                          "--progress": `${tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%`,
                        } as React.CSSProperties
                      }
                    >
                      <div>
                        <strong>
                          {tasks.length
                            ? Math.round(
                                (completedTasks.length / tasks.length) * 100,
                              )
                            : 0}
                          %
                        </strong>
                        <small>complete</small>
                      </div>
                    </div>
                    <div className="insight-copy">
                      <strong>Keep the good work going</strong>
                      <p>
                        You’ve completed {completedTasks.length} of{" "}
                        {tasks.length} tasks. Every small step adds up.
                      </p>
                      <button
                        className="text-link"
                        onClick={() => go("planner")}
                      >
                        See your planner <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </section>
                <section className="panel community-teaser">
                  <div className="panel-head">
                    <div>
                      <span className="section-kicker">BETTER TOGETHER</span>
                      <h3>From the community</h3>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => go("community")}
                    >
                      Explore <ArrowRight size={15} />
                    </button>
                  </div>
                  {myPosts.slice(0, 2).map((p) => (
                    <button
                      className="teaser-post"
                      key={p.id}
                      onClick={() => go("community")}
                    >
                      <span className="post-avatar">
                        {initials(p.author || "CM")}
                      </span>
                      <span>
                        <strong>{p.title}</strong>
                        <small>
                          {p.author} · {p.topic}
                        </small>
                      </span>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </section>
              </div>
            </>
          )}
          {page === "explore" && (
            <>
              <div className="page-heading split">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> DISCOVER
                  </div>
                  <h1>Find your next opportunity</h1>
                  <p>Great work starts with the right connection.</p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    if (requireUser()) {
                      setSelectedJob(null);
                      setModal("job");
                    }
                  }}
                >
                  <Plus size={17} /> Post a job
                </button>
              </div>
              <div className="search-panel">
                <div className="search-input">
                  <Search size={20} />
                  <input
                    aria-label="Search jobs"
                    placeholder="Search roles, skills, or companies..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      aria-label="Clear search"
                      onClick={() => setQuery("")}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <span className="search-separator" />
                <Filter size={18} />
                <span className="filter-label">Category</span>
                <select
                  aria-label="Filter by category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="results-heading">
                <strong>{filteredJobs.length} opportunities</strong>
                <span>Find a role that fits where you want to go</span>
              </div>
              <div className="job-grid">
                {filteredJobs.map((job, i) => (
                  <article className="job-card" key={job.id}>
                    <div className="job-card-top">
                      <span className={`company-logo logo-${i % 4}`}>
                        {job.company.slice(0, 1)}
                      </span>
                      <button
                        className={
                          saved.includes(job.id)
                            ? "save-button saved"
                            : "save-button"
                        }
                        aria-label={
                          saved.includes(job.id)
                            ? "Remove saved job"
                            : "Save job"
                        }
                        onClick={() => toggleSaved(job.id)}
                      >
                        <Bookmark
                          size={19}
                          fill={
                            saved.includes(job.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                    </div>
                    <div className="job-meta">
                      {job.company} <span>·</span> {fmtDate(job.created_at)}
                    </div>
                    <h3>{job.title}</h3>
                    <p>{job.description}</p>
                    <div className="tag-row">
                      {(job.skills || []).slice(0, 3).map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                    <div className="job-card-footer">
                      <div>
                        <strong>{job.salary || "Competitive"}</strong>
                        <small>
                          <MapPin size={13} />
                          {job.location}
                        </small>
                      </div>
                      <button onClick={() => openJob(job)}>
                        View role <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {filteredJobs.length === 0 && (
                <div className="empty-state">
                  <Search size={28} />
                  <h3>No matching roles</h3>
                  <p>Try a different search or category.</p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setCategory("All");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
          {page === "applications" && (
            <>
              <div className="page-heading split">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> YOUR PIPELINE
                  </div>
                  <h1>Applications</h1>
                  <p>Keep track of every opportunity in one place.</p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => go("explore")}
                >
                  Find more roles <ArrowUpRight size={17} />
                </button>
              </div>
              {!user ? (
                <div className="empty-state large">
                  <BriefcaseBusiness size={30} />
                  <h3>Make your next move</h3>
                  <p>
                    Sign in to apply for roles and track every step of your
                    journey.
                  </p>
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setModal("auth");
                    }}
                  >
                    Create an account
                  </button>
                </div>
              ) : applications.length === 0 ? (
                <div className="empty-state large">
                  <BriefcaseBusiness size={30} />
                  <h3>No applications yet</h3>
                  <p>
                    Explore roles that fit your skills and send your first
                    application.
                  </p>
                  <button onClick={() => go("explore")}>Explore jobs</button>
                </div>
              ) : (
                <div className="application-list">
                  {applications.map((a) => {
                    const job = jobs.find((j) => j.id === a.job_id);
                    return (
                      <div className="application-row" key={a.id}>
                        <span className="company-logo logo-0">
                          {job?.company?.slice(0, 1) || "S"}
                        </span>
                        <div>
                          <strong>{job?.title || "Job opportunity"}</strong>
                          <small>
                            {job?.company || "Employer"} · Applied{" "}
                            {fmtDate(a.created_at)}
                          </small>
                        </div>
                        <span
                          className={`status-pill ${a.status || "applied"}`}
                        >
                          {a.status || "applied"}
                        </span>
                        <button
                          aria-label="View job"
                          onClick={() => job && openJob(job)}
                        >
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {page === "applications" &&
            user &&
            (profile?.user_type === "recruiter" || incoming.length > 0) && (
              <section className="received-section">
                <div className="panel-head">
                  <div>
                    <span className="section-kicker">FOR RECRUITERS</span>
                    <h3>
                      Received applications{" "}
                      <span className="count-badge">{incoming.length}</span>
                    </h3>
                  </div>
                </div>
                {incoming.length === 0 ? (
                  <div className="empty-compact">
                    No applicants yet. Post a job to start meeting talent.
                  </div>
                ) : (
                  <div className="application-list">
                    {incoming.map((a) => {
                      const job = jobs.find((j) => j.id === a.job_id);
                      return (
                        <div className="application-row" key={a.id}>
                          <span className="post-avatar">
                            {initials(applicantNames[a.user_id] || "Applicant")}
                          </span>
                          <div>
                            <strong>
                              {applicantNames[a.user_id] || "Applicant"}
                            </strong>
                            <small>
                              {job?.title || "Job"} · {fmtDate(a.created_at)}
                            </small>
                            <small>{a.cover_letter}</small>
                          </div>
                          <select
                            aria-label="Application status"
                            className="status-select"
                            value={a.status || "applied"}
                            onChange={(e) =>
                              changeApplicationStatus(a, e.target.value)
                            }
                          >
                            <option value="applied">Applied</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="interview">Interview</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}{" "}
          {page === "planner" && (
            <>
              <div className="page-heading split">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> STAY ORGANIZED
                  </div>
                  <h1>Your planner</h1>
                  <p>Make space for the work that matters most.</p>
                </div>
                <div className="heading-actions">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (requireUser()) setModal("event");
                    }}
                  >
                    <CalendarDays size={17} /> Add event
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => setModal("task")}
                  >
                    <Plus size={17} /> New task
                  </button>
                </div>
              </div>
              <div className="planner-grid">
                <section className="panel planner-tasks">
                  <div className="panel-head">
                    <div>
                      <span className="section-kicker">TO DO</span>
                      <h3>
                        Your tasks{" "}
                        <span className="count-badge">
                          {activeTasks.length}
                        </span>
                      </h3>
                    </div>
                  </div>
                  {tasks.length === 0 && (
                    <div className="empty-compact">
                      No tasks yet. Add one to get started.
                    </div>
                  )}
                  {tasks.map((t) => (
                    <div
                      className={`planner-task ${t.status === "completed" ? "done" : ""}`}
                      key={t.id}
                    >
                      <button
                        className="task-check"
                        aria-label={
                          t.status === "completed"
                            ? "Mark incomplete"
                            : "Complete task"
                        }
                        onClick={() => toggleTask(t)}
                      >
                        {t.status === "completed" && <Check size={14} />}
                      </button>
                      <div>
                        <strong>{t.title}</strong>
                        <small>
                          {t.project || "Personal"} <span>·</span>{" "}
                          {fmtDate(t.due_date)}
                        </small>
                      </div>
                      <span className={`priority ${t.priority}`}>
                        {t.priority}
                      </span>
                      <button
                        className="subtle-icon"
                        aria-label="Delete task"
                        onClick={() => deleteTask(t)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </section>
                <section className="panel calendar-panel">
                  <div className="calendar-head">
                    <button
                      className="subtle-icon"
                      aria-label="Previous month"
                      onClick={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                    >
                      <ChevronLeft size={19} />
                    </button>
                    <h3>
                      {viewDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <button
                      className="subtle-icon"
                      aria-label="Next month"
                      onClick={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                    >
                      <ChevronRight size={19} />
                    </button>
                  </div>
                  <div className="calendar-grid">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <span className="weekday" key={i}>
                        {d}
                      </span>
                    ))}
                    {Array.from(
                      {
                        length: new Date(
                          viewDate.getFullYear(),
                          viewDate.getMonth(),
                          1,
                        ).getDay(),
                      },
                      (_, i) => (
                        <span key={`blank-${i}`} />
                      ),
                    )}
                    {Array.from(
                      {
                        length: new Date(
                          viewDate.getFullYear(),
                          viewDate.getMonth() + 1,
                          0,
                        ).getDate(),
                      },
                      (_, i) => {
                        const d = localDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth(),
                            i + 1,
                          ),
                        );
                        const marked =
                          events.some(
                            (e) => localDate(new Date(e.start_time)) === d,
                          ) ||
                          tasks.some((t) => t.due_date?.slice(0, 10) === d);
                        return (
                          <button
                            key={d}
                            className={`day ${d === selectedDate ? "selected" : ""} ${d === localDate(new Date()) ? "today" : ""} ${marked ? "marked" : ""}`}
                            onClick={() => setSelectedDate(d)}
                          >
                            {i + 1}
                          </button>
                        );
                      },
                    )}
                  </div>
                  <div className="calendar-detail">
                    <div className="panel-head">
                      <div>
                        <span className="section-kicker">SELECTED DAY</span>
                        <h3>{fmtDate(selectedDate + "T12:00:00")}</h3>
                      </div>
                    </div>
                    {selectedDateEvents.map((e) => (
                      <div className="event-line" key={e.id}>
                        <span className="event-dot" />
                        <div>
                          <strong>{e.title}</strong>
                          <small>
                            {new Date(e.start_time).toLocaleTimeString(
                              "en-US",
                              { hour: "numeric", minute: "2-digit" },
                            )}
                          </small>
                        </div>
                      </div>
                    ))}
                    {selectedDateTasks.map((t) => (
                      <div className="event-line" key={t.id}>
                        <span className="event-dot task-dot" />
                        <div>
                          <strong>{t.title}</strong>
                          <small>Task · {t.priority} priority</small>
                        </div>
                      </div>
                    ))}
                    {selectedDateEvents.length + selectedDateTasks.length ===
                      0 && (
                      <p className="calendar-empty">
                        Nothing planned for this day.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
          {page === "community" && (
            <>
              <div className="page-heading split">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> GROW TOGETHER
                  </div>
                  <h1>Community</h1>
                  <p>Share ideas, find collaborators, and grow together.</p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setModal("post")}
                >
                  <Plus size={17} /> Create a post
                </button>
              </div>
              <div className="community-layout">
                <div>
                  <div className="community-intro">
                    <span>
                      <Users size={23} />
                    </span>
                    <div>
                      <h3>Good things happen together.</h3>
                      <p>
                        Ask a question, share an idea, or find someone to build
                        with.
                      </p>
                    </div>
                  </div>
                  {myPosts.map((p) => (
                    <article className="post-card" key={p.id}>
                      <div className="post-top">
                        <span className="post-avatar">
                          {initials(p.author || "CM")}
                        </span>
                        <div>
                          <strong>{p.author}</strong>
                          <small>
                            {fmtDate(p.created_at)} · {p.topic}
                          </small>
                        </div>
                        <span className="topic-chip">{p.topic}</span>
                      </div>
                      <h3>{p.title}</h3>
                      <p>{p.body}</p>
                      <div className="post-bottom">
                        <span>
                          <MessageCircle size={16} /> Conversation starter
                        </span>
                        <button
                          onClick={() => {
                            if (user && p.author_id !== user.id) {
                              setRecipient(p.author_id);
                              go("messages");
                            } else
                              announce(
                                "Join the conversation by sharing your own post.",
                              );
                          }}
                        >
                          Connect <ArrowRight size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <aside className="community-side">
                  <div className="panel">
                    <span className="section-kicker">THE SPACE</span>
                    <h3>Better work, together.</h3>
                    <p>
                      Meet people who share your ambition. Bring your ideas and
                      make something great.
                    </p>
                    <div className="community-numbers">
                      <div>
                        <strong>{posts.length}</strong>
                        <small>Posts</small>
                      </div>
                      <div>
                        <strong>{people.length || "—"}</strong>
                        <small>Members</small>
                      </div>
                    </div>
                  </div>
                  <div className="tip-card">
                    <Sparkles size={20} />
                    <h4>Start with a question</h4>
                    <p>
                      A thoughtful question is often the beginning of a great
                      collaboration.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
          {page === "messages" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">
                  <span className="eyebrow-dot" /> CONVERSATIONS
                </div>
                <h1>Messages</h1>
                <p>Keep the conversation moving.</p>
              </div>
              {!user ? (
                <div className="empty-state large">
                  <MessageCircle size={30} />
                  <h3>Conversations start here</h3>
                  <p>Sign in to connect with recruiters and collaborators.</p>
                  <button
                    onClick={() => {
                      setAuthMode("signin");
                      setModal("auth");
                    }}
                  >
                    Sign in
                  </button>
                </div>
              ) : (
                <div className="messages-layout">
                  <div className="people-list">
                    <h3>Conversations</h3>
                    {conversations.length === 0 && (
                      <p>No conversations yet. Select a member to say hello.</p>
                    )}
                    {conversations.map((p) => (
                      <button
                        key={p.id}
                        className={
                          recipient === p.id ? "person active" : "person"
                        }
                        onClick={() => setRecipient(p.id)}
                      >
                        <span className="post-avatar">
                          {initials(p.full_name)}
                        </span>
                        <span>
                          <strong>{p.full_name}</strong>
                          <small>{p.title || p.user_type}</small>
                        </span>
                      </button>
                    ))}
                    <h4>People</h4>
                    {people
                      .filter((p) => !conversations.some((c) => c.id === p.id))
                      .slice(0, 12)
                      .map((p) => (
                        <button
                          key={p.id}
                          className={
                            recipient === p.id ? "person active" : "person"
                          }
                          onClick={() => setRecipient(p.id)}
                        >
                          <span className="post-avatar">
                            {initials(p.full_name)}
                          </span>
                          <span>
                            <strong>{p.full_name}</strong>
                            <small>{p.title || p.user_type}</small>
                          </span>
                        </button>
                      ))}
                  </div>
                  <div className="chat-panel">
                    {selectedPerson ? (
                      <>
                        <div className="chat-header">
                          <span className="post-avatar">
                            {initials(selectedPerson.full_name)}
                          </span>
                          <div>
                            <strong>{selectedPerson.full_name}</strong>
                            <small>
                              {selectedPerson.title || selectedPerson.user_type}
                            </small>
                          </div>
                        </div>
                        <div className="chat-history">
                          {shownMessages.length === 0 && (
                            <div className="chat-empty">
                              Say hello to{" "}
                              {selectedPerson.full_name.split(" ")[0]} 👋
                            </div>
                          )}
                          {shownMessages.map((m) => (
                            <div
                              key={m.id}
                              className={
                                m.sender_id === user.id
                                  ? "bubble mine"
                                  : "bubble"
                              }
                            >
                              {m.content}
                              <small>
                                {m.created_at
                                  ? new Date(m.created_at).toLocaleTimeString(
                                      "en-US",
                                      { hour: "numeric", minute: "2-digit" },
                                    )
                                  : ""}
                              </small>
                            </div>
                          ))}
                        </div>
                        <form className="chat-compose" onSubmit={sendMessage}>
                          <input
                            aria-label="Write a message"
                            placeholder="Write a message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                          />
                          <button
                            type="submit"
                            disabled={busy || !messageText.trim()}
                            aria-label="Send message"
                          >
                            <Send size={18} />
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="chat-placeholder">
                        <MessageCircle size={30} />
                        <h3>Select a conversation</h3>
                        <p>Choose someone on the left to start talking.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {page === "profile" && (
            <>
              <div className="page-heading split">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> YOUR STORY
                  </div>
                  <h1>My profile</h1>
                  <p>Show people what you do best.</p>
                </div>
                {user && (
                  <button className="secondary-button" onClick={signOut}>
                    <LogOut size={16} /> Sign out
                  </button>
                )}
              </div>
              {!user ? (
                <div className="empty-state large">
                  <UserRound size={30} />
                  <h3>Make your mark</h3>
                  <p>
                    Create an account to build your profile and show your work.
                  </p>
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setModal("auth");
                    }}
                  >
                    Get started
                  </button>
                </div>
              ) : (
                <div className="profile-layout">
                  <div className="profile-summary panel">
                    <span className="profile-big-avatar">
                      {initials(profileForm.full_name || displayName)}
                    </span>
                    <h3>{profileForm.full_name || displayName}</h3>
                    <p>{profileForm.title || "Add your professional title"}</p>
                    <span>
                      <MapPin size={14} />
                      {profileForm.location || "Add location"}
                    </span>
                    <div className="profile-skills">
                      {profileForm.skills
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean)
                        .map((x) => (
                          <small key={x}>{x}</small>
                        ))}
                    </div>
                  </div>
                  <form className="panel profile-form" onSubmit={saveProfile}>
                    <div className="panel-head">
                      <div>
                        <span className="section-kicker">ABOUT YOU</span>
                        <h3>Edit your profile</h3>
                      </div>
                    </div>
                    <div className="form-grid">
                      <label>
                        Full name
                        <input
                          required
                          value={profileForm.full_name}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              full_name: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Professional title
                        <input
                          placeholder="e.g. Product Designer"
                          value={profileForm.title}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              title: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Location
                        <input
                          placeholder="e.g. Remote, India"
                          value={profileForm.location}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              location: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Skills <small>Separate with commas</small>
                        <input
                          placeholder="React, Figma, Strategy"
                          value={profileForm.skills}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              skills: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="full">
                        Bio
                        <textarea
                          rows={5}
                          placeholder="Tell us about your experience and what you love working on..."
                          value={profileForm.bio}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              bio: e.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    <button className="primary-button" disabled={busy}>
                      Save profile <Check size={16} />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {notice && (
        <div className="toast-note">
          <span>
            <CheckCircle2 size={18} />
          </span>
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              aria-label="Close"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "auth" && (
              <>
                <div className="modal-icon">
                  <Sparkles size={22} />
                </div>
                <h2>
                  {authMode === "signin" ? "Welcome back" : "Join skillspace"}
                </h2>
                <p>
                  {authMode === "signin"
                    ? "Your opportunities are waiting."
                    : "Create your space to find work and grow."}
                </p>
                <form onSubmit={submitAuth}>
                  <div className="form-grid">
                    {authMode === "signup" && (
                      <>
                        <label className="full">
                          Full name
                          <input
                            required
                            value={authForm.name}
                            onChange={(e) =>
                              setAuthForm({ ...authForm, name: e.target.value })
                            }
                            placeholder="Your name"
                          />
                        </label>
                        <label className="full">
                          I’m here to
                          <select
                            value={authForm.role}
                            onChange={(e) =>
                              setAuthForm({ ...authForm, role: e.target.value })
                            }
                          >
                            <option value="freelancer">
                              Find freelance work
                            </option>
                            <option value="recruiter">Hire talent</option>
                          </select>
                        </label>
                      </>
                    )}
                    <label className="full">
                      Email
                      <input
                        required
                        type="email"
                        value={authForm.email}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, email: e.target.value })
                        }
                        placeholder="you@example.com"
                      />
                    </label>
                    <label className="full">
                      Password
                      <input
                        required
                        minLength={8}
                        type="password"
                        value={authForm.password}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, password: e.target.value })
                        }
                        placeholder="At least 8 characters"
                      />
                    </label>
                  </div>
                  <button className="primary-button wide" disabled={busy}>
                    {busy
                      ? "Please wait..."
                      : authMode === "signin"
                        ? "Sign in"
                        : "Create account"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </form>
                <div className="modal-switch">
                  {authMode === "signin"
                    ? "New here?"
                    : "Already have an account?"}{" "}
                  <button
                    onClick={() =>
                      setAuthMode(authMode === "signin" ? "signup" : "signin")
                    }
                  >
                    {authMode === "signin" ? "Create an account" : "Sign in"}
                  </button>
                </div>
              </>
            )}
            {modal === "task" && (
              <>
                <div className="modal-icon peach">
                  <CheckCircle2 size={22} />
                </div>
                <h2>Add a task</h2>
                <p>Turn your next step into a plan.</p>
                <form onSubmit={createTask}>
                  <div className="form-grid">
                    <label className="full">
                      Task name
                      <input
                        required
                        autoFocus
                        placeholder="What needs to get done?"
                        value={taskForm.title}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, title: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Due date
                      <input
                        type="date"
                        value={taskForm.due_date}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, due_date: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Priority
                      <select
                        value={taskForm.priority}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, priority: e.target.value })
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                    <label className="full">
                      Project <small>Optional</small>
                      <input
                        placeholder="e.g. Portfolio"
                        value={taskForm.project}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, project: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <button className="primary-button wide" disabled={busy}>
                    Add task <Plus size={16} />
                  </button>
                </form>
              </>
            )}
            {modal === "event" && (
              <>
                <div className="modal-icon blue">
                  <CalendarDays size={22} />
                </div>
                <h2>Schedule an event</h2>
                <p>Keep your important moments in view.</p>
                <form onSubmit={createEvent}>
                  <div className="form-grid">
                    <label className="full">
                      Event title
                      <input
                        required
                        placeholder="e.g. Client call"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, title: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Date
                      <input
                        required
                        type="date"
                        value={eventForm.date}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, date: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Time
                      <input
                        required
                        type="time"
                        value={eventForm.time}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, time: e.target.value })
                        }
                      />
                    </label>
                    <label className="full">
                      Notes <small>Optional</small>
                      <textarea
                        rows={3}
                        value={eventForm.description}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <button className="primary-button wide" disabled={busy}>
                    Add event <Plus size={16} />
                  </button>
                </form>
              </>
            )}
            {modal === "post" && (
              <>
                <div className="modal-icon">
                  <Users size={22} />
                </div>
                <h2>Create a post</h2>
                <p>Start a conversation with the community.</p>
                <form onSubmit={createPost}>
                  <div className="form-grid">
                    <label className="full">
                      Title
                      <input
                        required
                        placeholder="What’s on your mind?"
                        value={postForm.title}
                        onChange={(e) =>
                          setPostForm({ ...postForm, title: e.target.value })
                        }
                      />
                    </label>
                    <label className="full">
                      Topic
                      <select
                        value={postForm.topic}
                        onChange={(e) =>
                          setPostForm({ ...postForm, topic: e.target.value })
                        }
                      >
                        <option>Discussion</option>
                        <option>Collaboration</option>
                        <option>Advice</option>
                        <option>Showcase</option>
                      </select>
                    </label>
                    <label className="full">
                      Your post
                      <textarea
                        required
                        rows={5}
                        placeholder="Share a little more..."
                        value={postForm.body}
                        onChange={(e) =>
                          setPostForm({ ...postForm, body: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <button className="primary-button wide" disabled={busy}>
                    Publish post <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}
            {modal === "job" && !selectedJob && (
              <>
                <div className="modal-icon">
                  <BriefcaseBusiness size={22} />
                </div>
                <h2>Post a job</h2>
                <p>Share an opportunity with the Skill Space community.</p>
                <form onSubmit={createJob}>
                  <div className="form-grid">
                    <label className="full">
                      Role title
                      <input
                        required
                        placeholder="e.g. Frontend developer"
                        value={jobForm.title}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, title: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Company
                      <input
                        required
                        value={jobForm.company}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, company: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Location
                      <input
                        required
                        value={jobForm.location}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, location: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Type
                      <select
                        value={jobForm.job_type}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, job_type: e.target.value })
                        }
                      >
                        <option>Contract</option>
                        <option>Project</option>
                        <option>Part-time</option>
                        <option>Full-time</option>
                      </select>
                    </label>
                    <label>
                      Category
                      <select
                        value={jobForm.category}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, category: e.target.value })
                        }
                      >
                        <option>Development</option>
                        <option>Design</option>
                        <option>Writing</option>
                        <option>Marketing</option>
                        <option>Branding</option>
                        <option>Other</option>
                      </select>
                    </label>
                    <label className="full">
                      Budget or rate
                      <input
                        required
                        placeholder="e.g. $80–120 / hr"
                        value={jobForm.salary}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, salary: e.target.value })
                        }
                      />
                    </label>
                    <label className="full">
                      Skills <small>Separate with commas</small>
                      <input
                        placeholder="React, TypeScript"
                        value={jobForm.skills}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, skills: e.target.value })
                        }
                      />
                    </label>
                    <label className="full">
                      Description
                      <textarea
                        required
                        rows={5}
                        value={jobForm.description}
                        onChange={(e) =>
                          setJobForm({
                            ...jobForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <button className="primary-button wide" disabled={busy}>
                    Publish job <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}{" "}
            {modal === "job" && selectedJob && (
              <>
                <div className="job-modal-brand">
                  <span className="company-logo logo-0">
                    {selectedJob.company.slice(0, 1)}
                  </span>
                  <span>
                    {selectedJob.company} · {selectedJob.location}
                  </span>
                </div>
                <h2>{selectedJob.title}</h2>
                <div className="job-modal-tags">
                  <span>{selectedJob.job_type}</span>
                  <span>{selectedJob.category}</span>
                  <span>{selectedJob.salary}</span>
                </div>
                <h4>About this opportunity</h4>
                <p className="job-description">{selectedJob.description}</p>
                <h4>Skills</h4>
                <div className="tag-row">
                  {selectedJob.skills?.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <div className="modal-actions">
                  <button
                    className="secondary-button"
                    onClick={() => toggleSaved(selectedJob.id)}
                  >
                    <Bookmark size={16} />
                    {saved.includes(selectedJob.id) ? "Saved" : "Save role"}
                  </button>
                  <button
                    className="primary-button"
                    disabled={appliedIds.has(selectedJob.id)}
                    onClick={() => {
                      if (requireUser()) setModal("apply");
                    }}
                  >
                    {appliedIds.has(selectedJob.id) ? "Applied" : "Apply now"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
            {modal === "apply" && selectedJob && (
              <>
                <div className="modal-icon">
                  <BriefcaseBusiness size={22} />
                </div>
                <h2>Apply to {selectedJob.company}</h2>
                <p>{selectedJob.title}</p>
                <form onSubmit={applyJob}>
                  <div className="form-grid">
                    <label className="full">
                      Why are you a great fit?
                      <textarea
                        required
                        minLength={20}
                        rows={6}
                        placeholder="Introduce yourself and share relevant experience..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                    </label>
                  </div>
                  <button className="primary-button wide" disabled={busy}>
                    Send application <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
