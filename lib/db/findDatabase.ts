import path from 'path';
import os from 'os';
import fs from 'fs';

export const DB_NAME = 'fortsmart_agro.db';

/**
 * Detecta automaticamente o caminho do banco SQLite do Flutter.
 * O Flutter usa getApplicationDocumentsDirectory() no Windows/macOS/Linux.
 * Em Windows isso resulta em %USERPROFILE%\Documents ou AppData\Roaming\<app>.
 */
export function findDatabasePath(): string | null {
    const username = os.userInfo().username;
    const home = os.homedir();

    // Caminhos possíveis onde o Flutter armazena o banco no Windows
    const candidates: string[] = [
        // Windows: getApplicationDocumentsDirectory() → Documents/
        path.join(home, 'Documents', DB_NAME),
        // Windows AppData\Roaming (sqflite_common_ffi default)
        path.join(home, 'AppData', 'Roaming', 'fortsmart', DB_NAME),
        path.join(home, 'AppData', 'Roaming', 'fortsmart-agro', DB_NAME),
        path.join(home, 'AppData', 'Roaming', 'fortsmart-agro-admin', DB_NAME),
        path.join(home, 'AppData', 'Local', 'fortsmart_agro', DB_NAME),
        // Linux / macOS
        path.join(home, '.local', 'share', 'fortsmart_agro', DB_NAME),
        path.join(home, 'Library', 'Application Support', 'fortsmart_agro', DB_NAME),
        // Caminho de desenvolvimento (emulador Android via adb pull, copiado para workspace)
        path.join(process.cwd(), '..', DB_NAME),
        path.join(process.cwd(), DB_NAME),
    ];

    for (const candidate of candidates) {
        try {
            if (fs.existsSync(candidate)) {
                const stat = fs.statSync(candidate);
                if (stat.size > 0) {
                    console.log(`✅ FortSmart DB encontrado: ${candidate} (${stat.size} bytes)`);
                    return candidate;
                }
            }
        } catch { /* ignorar permissões */ }
    }

    console.warn('⚠️ fortsmart_agro.db não encontrado. Usando dados mock.');
    return null;
}

/** Caminho configurável via variável de ambiente (para produção/Docker) */
export function getDatabasePath(): string | null {
    if (process.env.FORTSMART_DB_PATH) {
        const envPath = process.env.FORTSMART_DB_PATH;
        if (fs.existsSync(envPath)) {
            console.log(`✅ FortSmart DB via env: ${envPath}`);
            return envPath;
        }
        console.warn(`⚠️ FORTSMART_DB_PATH inválido: ${envPath}`);
    }
    return findDatabasePath();
}
