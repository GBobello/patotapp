// Ícone do app desenhado em JSX para o ImageResponse (sem arquivos de imagem no repositório).
// Bola estilizada: círculo branco com pentágono verde, sobre fundo verde do tema.

export function BrandIcon({ size, maskable = false }: { size: number; maskable?: boolean }) {
  // Ícones "maskable" precisam de margem de segurança: o sistema pode recortar em círculo.
  const ball = Math.round(size * (maskable ? 0.52 : 0.72));
  const patch = Math.round(ball * 0.36);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1B6B3A",
        borderRadius: maskable ? 0 : Math.round(size * 0.22),
      }}
    >
      <div
        style={{
          width: ball,
          height: ball,
          borderRadius: ball,
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: patch,
            height: patch,
            background: "#1B6B3A",
            clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
          }}
        />
      </div>
    </div>
  );
}
