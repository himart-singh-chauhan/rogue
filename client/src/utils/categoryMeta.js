// Record categories come from the database (Admin → Categories), so a category or subcategory
// saved there shows up on the homepage, the Categories page and Explore Records.
// This file only adds presentation: an icon, a short description and example disciplines
// for names we know. Unknown names still work and get a generic icon.
import { useEffect, useState } from "react";
import {
  Activity, Dumbbell, Timer, Target, Trophy, Gamepad2, Waves, Zap, Brain, Bike, Star, Palette, Baby,
  Sparkles, Laugh, PawPrint, Utensils, Flame, Mountain, Crosshair, Cpu, HeartPulse, PersonStanding,
  Medal, Award, Users, LayoutGrid,
} from "lucide-react";
import { apiCall } from "./api";

const key = (name) => String(name || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");

const META = {
  athletics: { Icon: Activity, desc: "Classic track and field events. Speed, agility, and pure athleticism.", subs: [
    { name: "Running", items: ["Sprinting", "Long Distance", "Relay Races", "Obstacle Running", "Backwards Running"] },
    { name: "Jumping", items: ["High Jump", "Long Jump", "Vertical Jump", "Standing Broad Jump"] },
    { name: "Throwing", items: ["Javelin Throw", "Discus Throw", "Shot Put", "Accuracy Throws"] },
    { name: "Agility", items: ["Ladder Drills", "Footwork Challenges", "Speed Course Runs"] },
  ] },
  strength: { Icon: Dumbbell, desc: "Lift more than anyone on the planet. Pure power, zero excuses.", subs: [
    { name: "Upper Body", items: ["Bench Press", "Push-Ups", "Pull-Ups", "Arm Wrestling", "Grip Strength"] },
    { name: "Lower Body", items: ["Squats", "Leg Press", "Wall Sits", "Lunges"] },
    { name: "Full Body", items: ["Deadlifts", "Tire Flips", "Atlas Stone Lifts", "Weighted Carries"] },
    { name: "Functional", items: ["Rope Pulling", "Object Carrying", "Vehicle Pulls", "Sandbag Challenges"] },
    { name: "Power", items: ["Punch Strength", "Kicking Power", "Sledgehammer Challenges"] },
  ] },
  speed: { Icon: Zap, desc: "Fastest on the planet. Every millisecond counts.", subs: [
    { name: "Sprints", items: ["40-Yard Dash", "100 Meters", "Shuttle Runs", "Stair Sprints"] },
    { name: "Hand Speed", items: ["Fastest Punches", "Speed Bag", "Cup Stacking", "Typing Speed"] },
    { name: "Reaction", items: ["Light Reaction", "Sound Reaction", "Catching Challenges"] },
  ] },
  reaction: { Icon: Zap, desc: "Fastest reflexes. Every millisecond counts.", subs: [
    { name: "Reflex Speed", items: ["Light Reaction", "Sound Reaction", "Catching Challenges"] },
    { name: "Combat & Gaming", items: ["Dodge Challenges", "Punch Reaction", "Aim Speed Challenges"] },
  ] },
  endurance: { Icon: Timer, desc: "Go the distance. Push the absolute limits of human stamina.", subs: [
    { name: "Cardio", items: ["Cycling", "Treadmill Challenges", "Stair Climbing", "Continuous Running"] },
    { name: "Strength Endurance", items: ["Push-Up Marathons", "Pull-Up Endurance", "Plank Holds", "Squat Reps"] },
    { name: "Mental & Environment", items: ["Cold Exposure", "Heat Challenges", "Survival"] },
    { name: "Multi-Day", items: ["Longest Duration", "Continuous Exercise Records"] },
  ] },
  balance: { Icon: Target, desc: "Steady hands and focus. Mastery of equilibrium in any situation.", subs: [
    { name: "Static Balance", items: ["One-Leg Stands", "Handstands", "Headstands", "Balance Beam Holds"] },
    { name: "Object Balancing", items: ["Chair Balancing", "Pole Balancing", "Stack Balancing"] },
    { name: "Dynamic Balance", items: ["Slackline Walking", "Tightrope Challenges", "Rolling Balance"] },
  ] },
  flexibility: { Icon: PersonStanding, desc: "Bend further than anyone. Splits, contortion and mobility feats.", subs: [
    { name: "Splits & Holds", items: ["Front Splits", "Middle Splits", "Longest Bridge Hold"] },
    { name: "Contortion", items: ["Backbends", "Chest Stands", "Contortion Holds"] },
  ] },
  fitness: { Icon: HeartPulse, desc: "Reps, circuits and conditioning tests. Fitness proven on camera.", subs: [
    { name: "Bodyweight", items: ["Burpees", "Push-Ups", "Sit-Ups", "Squats"] },
    { name: "Circuits", items: ["Timed Circuits", "Jump Rope", "Kettlebell Swings"] },
  ] },
  sports: { Icon: Medal, desc: "Ball skills, shots and sporting feats from every game.", subs: [
    { name: "Ball Sports", items: ["Basketball Shots", "Football Juggling", "Baseball Pitch Speed"] },
    { name: "Combat Sports", items: ["Board Breaking", "Kick Height", "Punch Count"] },
  ] },
  watersports: { Icon: Waves, desc: "Dominate the waves. Swimming, surfing, and aquatic achievements.", subs: [
    { name: "Swimming & Diving", items: ["Sprint/Distance", "Underwater", "High Diving", "Trick Diving"] },
    { name: "Surfing & Paddle", items: ["Longest Ride", "Biggest Wave", "Kayaking", "Paddle Boarding"] },
  ] },
  gaming: { Icon: Gamepad2, desc: "From speedruns to high scores. Digital dominance, verified.", subs: [
    { name: "Speedrunning", items: ["Fastest Completion", "Category Speedruns"] },
    { name: "Score Challenges", items: ["Highest Scores", "Kill Records", "Combo Records"] },
    { name: "Competitive", items: ["Tournament Streaks", "Ranked Challenges"] },
    { name: "Emerging Tech", items: ["VR Challenges", "Mobile High Scores", "Retro/Arcade Records"] },
  ] },
  entertainment: { Icon: Star, desc: "Show-stopping performances. Magic, stunts, and stage records.", subs: [
    { name: "Performance", items: ["Magic Tricks", "Stunt Records", "Stage Achievements", "Comedic Feats"] },
    { name: "Artistic", items: ["Live Drawing", "Artistic Speed Challenges", "Unique Creations"] },
  ] },
  // "Skills" was renamed to "Talent"
  talent: { Icon: Trophy, desc: "Precision, technique, mastery. Show the world what you can do.", subs: [
    { name: "Precision", items: ["Card Throwing", "Trick Shots", "Accuracy Challenges", "Dart Challenges"] },
    { name: "Coordination", items: ["Juggling", "Cup Stacking", "Hand-Eye Coordination"] },
    { name: "Speed Talent", items: ["Puzzle Solving", "Rubik's Cube", "Typing Speed"] },
    { name: "Object Manipulation", items: ["Yo-Yo Tricks", "Pen Spinning", "Coin Tricks"] },
  ] },
  skills: { alias: "talent" },
  funnytalent: { Icon: Laugh, desc: "Funny talents for all ages: the strange, silly and surprising things only you can do.", subs: [] },
  funnytalents: { alias: "funnytalent" },
  mindandmemory: { Icon: Brain, desc: "Cognitive greatness. Rubik's cubes, memory feats, and logic.", subs: [
    { name: "Memory & Math", items: ["Number/Card Memorization", "Name Recall", "Mental Math"] },
    { name: "Logic & Focus", items: ["Puzzle Completion", "Focus Duration"] },
    { name: "Strategy", items: ["Chess", "Strategy Games"] },
  ] },
  actionsports: { Icon: Bike, desc: "X-Games style adrenaline. Skating, BMX, and extreme feats.", subs: [
    { name: "Wheels", items: ["Skate Trick Records", "BMX Rotation", "Scooter Air Time", "Bike Wheelies"] },
    { name: "Parkour", items: ["Wall Runs", "Vault Challenges"] },
  ] },
  creativeskills: { Icon: Palette, desc: "Art, design, and unique creations. Breaking boundaries through creativity.", subs: [
    { name: "Design", items: ["Architectural Challenges", "Digital Art", "Crafting Speed"] },
    { name: "Innovation", items: ["Unique Problem Solving", "Prototype Records"] },
  ] },
  creativechallenges: { alias: "creativeskills" },
  creative: { alias: "creativeskills" },
  stunts: { Icon: Flame, desc: "Daring stunts performed safely and verified on camera.", subs: [
    { name: "Stunt Work", items: ["Flips", "Falls", "Fire Stunts", "Vehicle Stunts"] },
  ] },
  foodchallenges: { Icon: Utensils, desc: "Eating and drinking challenges against the clock.", subs: [
    { name: "Speed Eating", items: ["Hot Dogs", "Pizza", "Wings", "Spicy Challenges"] },
  ] },
  animalrecords: { Icon: PawPrint, desc: "Record-breaking pets and animal tricks.", subs: [
    { name: "Pet Tricks", items: ["Dog Tricks", "Jumps", "Speed Runs"] },
  ] },
  teamrecords: { Icon: Users, desc: "Records set together: relays, groups and mass participation.", subs: [
    { name: "Group Feats", items: ["Relays", "Mass Participation", "Team Lifts"] },
  ] },
  kidsyouthrecords: { Icon: Baby, desc: "Just for the next generation. Safe, fun, and highly competitive.", subs: [
    { name: "Core Skills", items: ["Fastest Cup Stacking", "Longest Hula Hoop", "Basketball Shots (1 Min)", "Fastest Puzzle"] },
    { name: "Play & Game", items: ["Jump Rope", "Balloon Balancing", "Toy Building", "Memory Games"] },
  ] },
  youth: { alias: "kidsyouthrecords" },
  youthcategory: { alias: "kidsyouthrecords" },
  seniorrecords: { Icon: Award, desc: "Records for athletes 50 and over. Age is just a number.", subs: [
    { name: "Masters", items: ["Strength", "Endurance", "Fitness"] },
  ] },
  extremechallenges: { Icon: Mountain, desc: "The toughest challenges on the planet. Only the bold apply.", subs: [
    { name: "Extreme", items: ["Cold Exposure", "Heat Challenges", "Survival", "Altitude"] },
  ] },
  precisionskills: { Icon: Crosshair, desc: "Accuracy that has to be seen to be believed.", subs: [
    { name: "Accuracy", items: ["Trick Shots", "Target Throws", "Card Throwing", "Archery"] },
  ] },
  technologyinnovation: { Icon: Cpu, desc: "Inventions, robotics and tech-powered records.", subs: [
    { name: "Tech", items: ["Robotics", "Drones", "Coding Speed"] },
  ] },
  miscellaneous: { Icon: Sparkles, desc: "Unique talents and achievements that defy standard classification.", subs: [
    { name: "Miscellaneous", items: ["Collections", "Mass Participation", "Large Constructions", "Oddities"] },
  ] },
  other: { alias: "miscellaneous" },
};

export const categoryMeta = (name) => {
  let m = META[key(name)];
  if (m?.alias) m = META[m.alias];
  return m || { Icon: LayoutGrid, desc: "", subs: [] };
};

// Used only if the categories API cannot be reached
const FALLBACK_NAMES = ["Athletics", "Strength", "Endurance", "Balance", "Talent", "Gaming", "Water Sports", "Reaction", "Mind & Memory", "Action Sports", "Entertainment", "Creative Skills", "Kids / Youth Records", "Miscellaneous"];
const FALLBACK_TREE = FALLBACK_NAMES.map((name, i) => ({
  id: `fallback-${i}`, name, description: "", active: true,
  children: name === "Talent" ? [{ id: "fallback-funny", name: "Funny Talent", description: "", active: true, children: [] }] : [],
}));

const isActive = (c) => c && c.active !== false;
const clean = (nodes) => (nodes || []).filter(isActive).map((c) => ({ ...c, children: clean(c.children) }));

let cache = null; // one request per page load
const loadCategories = () => {
  if (!cache) {
    cache = apiCall("/categories", "GET")
      .then((res) => {
        const tree = clean(res?.categories);
        if (!tree.length) throw new Error("no categories");
        return tree;
      })
      .catch((err) => {
        cache = null; // try again on the next page
        throw err;
      });
  }
  return cache;
};

// { tree, loaded }: tree = active top-level categories, each with active `children`
export const useCategories = () => {
  const [state, setState] = useState({ tree: FALLBACK_TREE, loaded: false });
  useEffect(() => {
    let cancelled = false;
    loadCategories()
      .then((tree) => { if (!cancelled) setState({ tree, loaded: true }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return state;
};

// Category plus all its subcategory names (for filtering records)
export const namesWithChildren = (node) => [node.name, ...(node.children || []).flatMap(namesWithChildren)];

// Verified records in a category and its subcategories (null when the API did not send counts)
export const recordTotal = (node) => {
  const all = [node, ...(node.children || [])];
  if (!all.some((c) => c.verifiedCount !== undefined || c.recordCount !== undefined)) return null;
  return all.reduce((sum, c) => sum + (Number(c.verifiedCount ?? c.recordCount) || 0), 0);
};
