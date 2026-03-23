import html2canvas from "html2canvas-pro";

export async function exportGridAsImage(
  gridElement: HTMLElement,
  templateName: string
): Promise<void> {
  const container = document.createElement("div");
  container.style.padding = "24px";
  container.style.background = "#1a1a1a";
  container.style.borderRadius = "12px";
  container.style.display = "inline-block";

  const title = document.createElement("h3");
  title.textContent = templateName || "Custom";
  title.style.marginBottom = "12px";
  title.style.textAlign = "center";
  title.style.fontFamily = "Inter, sans-serif";
  title.style.color = "#f0f0f0";
  title.style.fontSize = "14px";
  container.appendChild(title);

  const gridClone = gridElement.cloneNode(true) as HTMLElement;
  container.appendChild(gridClone);

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: "#1a1a1a",
      scale: 2,
      logging: false,
    });

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `pokz02-kustomizer-${templateName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.click();
  } finally {
    document.body.removeChild(container);
  }
}
