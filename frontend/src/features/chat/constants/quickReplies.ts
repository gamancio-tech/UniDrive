import {
  faVanShuttle,
  faLocationDot,
  faClock,
  faPersonRunning,
  faHand,
  faThumbsUp,
  faFlagCheckered,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

export interface QuickReply {
  icon: IconDefinition;
  text: string;
}

// Respostas rápidas pré-definidas do chat (constantes de módulo: não são recriadas a cada render).
export const STUDENT_QUICK_REPLIES: QuickReply[] = [
  { icon: faLocationDot, text: "Estou no Ponto" },
  { icon: faClock, text: "Atraso (5 min)" },
  { icon: faPersonRunning, text: "Estou descendo!" },
  { icon: faVanShuttle, text: "Já estou na van" },
  { icon: faHand, text: "Pode ir sem mim" },
  { icon: faThumbsUp, text: "Tudo certo!" },
];

export const DRIVER_QUICK_REPLIES: QuickReply[] = [
  { icon: faVanShuttle, text: "Já estou saindo!" },
  { icon: faLocationDot, text: "Cheguei no ponto" },
  { icon: faClock, text: "Aguardando no portão" },
  { icon: faThumbsUp, text: "Pode vir com calma!" },
  { icon: faFlagCheckered, text: "Viagem encerrada" },
  { icon: faHand, text: "Até mais!" },
];
