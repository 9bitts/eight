export type FeedPost = {
  id: number;
  name: string;
  handle: string;
  spec: string;
  loc: string;
  time: string;
  liked: boolean;
  reposted?: boolean;
  likes: number;
  reposts: number;
  replies: number;
  body: string;
};

export const SEED_POSTS: FeedPost[] = [
  {
    id: 1, name: "Dra. Ana Beltrão", handle: "anabeltrao", spec: "Cardiologia · CRM-SP",
    loc: "São Paulo, BR", time: "2h", liked: false, likes: 48, reposts: 12, replies: 9,
    body: "Voltando do congresso de cardiologia com a cabeça fervilhando sobre os novos protocolos de insuficiência cardíaca. Quem mais esteve lá? Vamos abrir um fio pra trocar o que cada um trouxe de mais útil. 🫀",
  },
  {
    id: 2, name: "Dr. Miguel Costa", handle: "miguelcosta", spec: "Medicina Geral · OM-PT",
    loc: "Lisboa, PT", time: "4h", liked: true, likes: 31, reposts: 4, replies: 17,
    body: "Colegas que já fazem teleconsulta para a comunidade lusófona nos EUA e Canadá: como gerem a diferença de fuso e a questão da receita entre países? Estou a começar e toda a partilha ajuda.",
  },
  {
    id: 3, name: "Sarah Lin, MD", handle: "drsarahlin", spec: "Endocrinology · Verified",
    loc: "Boston, US", time: "6h", liked: false, likes: 124, reposts: 39, replies: 22,
    body: "New review on GLP-1 long-term adherence is worth your time. The drop-off after month 6 is steeper than most of us assume. Sharing my 5 key clinical takeaways below 🧵",
  },
  {
    id: 4, name: "Enf. Carla Dias", handle: "carladias", spec: "Enfermagem · COREN",
    loc: "Porto, PT", time: "9h", liked: false, likes: 67, reposts: 21, replies: 6,
    body: "Implementámos um protocolo de acolhimento que reduziu o tempo de triagem em ~30%. Partilho o fluxograma para quem quiser adaptar na sua unidade. A enfermagem também faz inovação. 💙",
  },
];

export const SUGGESTIONS = [
  { name: "Dr. João Reis", handle: "joaoreis", spec: "Pediatria" },
  { name: "Dra. Lúcia Mendes", handle: "luciamendes", spec: "Dermatologia" },
  { name: "Dr. Pedro Alves", handle: "pedroalves", spec: "Psiquiatria" },
];

export const TRENDS = [
  { tag: "#InsuficiênciaCardíaca", posts: "1,2 mil publicações" },
  { tag: "#Telemedicina", posts: "3,4 mil publicações" },
  { tag: "#MedLusófona", posts: "890 publicações" },
  { tag: "#SaúdeDigital", posts: "2,1 mil publicações" },
];
