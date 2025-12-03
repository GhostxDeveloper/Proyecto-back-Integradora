#!/usr/bin/env node
// scripts/view-logs.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../logs');

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    green: '\x1b[32m'
};

function colorizeLevel(level) {
    switch(level) {
        case 'error': return `${colors.red}${level}${colors.reset}`;
        case 'warn': return `${colors.yellow}${level}${colors.reset}`;
        case 'info': return `${colors.blue}${level}${colors.reset}`;
        case 'http': return `${colors.green}${level}${colors.reset}`;
        default: return level;
    }
}

function viewLogs(filename = 'combined') {
    const files = fs.readdirSync(logsDir)
        .filter(f => f.startsWith(filename))
        .sort()
        .reverse();

    if (files.length === 0) {
        console.log(`No se encontraron logs de tipo: ${filename}`);
        return;
    }

    const latestLog = path.join(logsDir, files[0]);
    console.log(`\n${colors.bright}📋 Mostrando: ${files[0]}${colors.reset}\n`);

    const content = fs.readFileSync(latestLog, 'utf-8');
    const lines = content.trim().split('\n');

    lines.forEach(line => {
        try {
            const log = JSON.parse(line);
            const timestamp = log.timestamp || '';
            const level = colorizeLevel(log.level || 'info');
            const message = log.message || '';

            console.log(`${timestamp} [${level}]: ${message}`);

            // Mostrar metadata adicional si existe
            const { timestamp: _, level: __, message: ___, ...meta } = log;
            if (Object.keys(meta).length > 0) {
                console.log(`  ${colors.bright}Metadata:${colors.reset}`, meta);
            }
        } catch (e) {
            console.log(line);
        }
    });

    console.log(`\n${colors.bright}Total de líneas:${colors.reset} ${lines.length}\n`);
}

// Procesar argumentos
const args = process.argv.slice(2);
const logType = args[0] || 'combined';

viewLogs(logType);