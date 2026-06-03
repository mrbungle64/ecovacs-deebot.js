FROM node:20-bookworm-slim

# Systemabhängigkeiten für native Node-Module installieren (z. B. für canvas)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app
RUN chown -R node:node /home/node/app

# Package-Dateien kopieren und Rechte an node übergeben
COPY --chown=node:node package*.json ./

USER node

# Abhängigkeiten installieren (erstellt node_modules im Image als Benutzer node)
# npm ci ist deterministisch, schneller und nutzt strikt das Lock-File
RUN npm ci

# Quellcode kopieren
COPY --chown=node:node . .

CMD ["node", "example/app.js"]
