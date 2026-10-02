/**
 * Ilustraciones de los empty states: un PNG plano (public/empty) sobre una
 * mancha crema dibujada aquí. La mancha cambia de forma en cada ilustración y
 * es siempre crema, también en modo oscuro, para que el trazo marino se lea.
 */
const BLOBS = {
  "sin-clases": { d: "M18 100C14 56 52 28 104 30C156 32 188 62 184 104C180 148 144 170 98 170C50 170 22 144 18 100Z" },
  "sin-cursos": { d: "M108 16C150 22 176 72 170 120C164 166 128 190 90 184C50 178 26 140 32 96C38 50 70 10 108 16Z" },
  "sin-alumnos": { d: "M16 120C14 90 40 72 66 78C86 82 96 62 122 62C156 62 186 84 186 116C186 150 156 166 112 166C64 166 18 152 16 120Z" },
  "sin-debates": { d: "M40 132C18 130 10 104 26 88C34 80 46 78 54 82C58 56 82 40 106 46C124 50 136 62 140 76C164 70 188 86 188 110C188 134 168 148 146 146L56 146C48 146 42 140 40 132Z" },
  "foro-tranquilo": { d: "M100 22C148 22 184 54 184 102C184 150 146 180 98 180C52 180 16 148 16 100C16 54 54 22 100 22Z" },
  "todo-hecho": { d: "M54 30H146C162 30 172 40 172 56V148C172 164 162 174 146 174H54C38 174 28 164 28 148V56C28 40 38 30 54 30Z", transform: "rotate(-10 100 100)" },
  "sin-notas": { d: "M44 64C64 36 110 40 132 52C150 62 164 50 178 66C194 86 186 128 160 150C132 174 82 176 52 160C20 142 22 94 44 64Z" },
  "sin-mensajes": { d: "M16 118C44 78 84 48 130 36C172 26 194 60 190 100C186 142 160 166 122 168C82 170 44 152 16 118Z" },
} as const;

export type EmptyArtName = keyof typeof BLOBS;

export function isEmptyArt(name: string): name is EmptyArtName {
  return name in BLOBS;
}

export function EmptyArt({ name, size = 180 }: { name: EmptyArtName; size?: number }) {
  const blob: { d: string; transform?: string } = BLOBS[name];
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden style={{ position: "absolute", inset: 0 }}>
        <path d={blob.d} transform={blob.transform} fill="#FBF7EF" />
      </svg>
      <img
        src={`/empty/${name}.webp`}
        alt=""
        width={size}
        height={size}
        style={{ position: "absolute", inset: "17%", width: "66%", height: "66%", objectFit: "contain" }}
      />
    </div>
  );
}
