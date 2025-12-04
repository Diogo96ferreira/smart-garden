from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    path = Path("src/locales/pt.json")
    raw = path.read_text(encoding="utf-8-sig")

    try:
        prefix, after_tasks = raw.split('"tasks": {', 1)
        after_tasks, garden_rest = after_tasks.split('"garden": {', 1)
    except ValueError:
        raise SystemExit("Could not find expected markers in pt.json")

    block = '''\
  "tasks": {
    "waterTitle": "Regar: {{name}}",
    "waterDesc": "Regar a cada {{days}} dia(s). Última rega: {{date}}.",
    "never": "nunca"
  },
  "legal": {
    "privacy": {
      "eyebrow": "Privacidade",
      "title": "Política de Privacidade",
      "summary": "Guardamos apenas o necessário para a Smart Garden funcionar. Sem surpresas.",
      "dataWeStore": "O que guardamos",
      "dataWeStoreDesc": "Dados de conta, plantas registadas, tarefas geradas e, se quiseres, fotos que envias para o armazenamento da Supabase.",
      "usage": "Como usamos",
      "usageDesc": "Para gerar tarefas de cuidado, sincronizar a tua horta entre dispositivos e melhorar recomendações. Não vendemos os teus dados.",
      "rights": "Os teus direitos",
      "rightsDesc": "Podes apagar a conta e os dados a qualquer momento via Suporte ou pedindo remoção."
    },
    "terms": {
      "eyebrow": "Termos",
      "title": "Termos de Utilização",
      "summary": "Usa a Smart Garden de forma responsável; as dicas são informativas e não substituem aconselhamento profissional.",
      "use": "Uso aceitável",
      "useDesc": "Não faças uso indevido, scraping ou ataques. Mantém os envios adequados e legais.",
      "liability": "Responsabilidade",
      "liabilityDesc": "Queremos ser precisos mas não garantimos resultados nas tuas culturas. Usa as recomendações por tua conta e risco.",
      "contact": "Contacto",
      "contactDesc": "Precisas de ajuda ou remover dados? Fala connosco pelo cartão de suporte ou em support@smartgarden.example."
    }
  },
  "garden": {
'''

    new_content = prefix + block + garden_rest
    parsed = json.loads(new_content)
    path.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
