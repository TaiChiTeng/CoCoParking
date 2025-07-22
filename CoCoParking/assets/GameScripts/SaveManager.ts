import { sys } from 'cc';

export class SaveManager {
    private static readonly SAVE_KEY = "parking_game_save";

    public static getLevel(): number {
        let saveString = sys.localStorage.getItem(this.SAVE_KEY);
        if (saveString) {
            let saveData = JSON.parse(saveString);
            return saveData.level || 1; // 默认从第一关开始
        } else {
            return 1;
        }
    }

    public static saveLevel(level: number): void {
        let saveData = { level: level };
        sys.localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
    }

    public static getSoundState(): boolean {
        let saveString = sys.localStorage.getItem(this.SAVE_KEY);
        if (saveString) {
            let saveData = JSON.parse(saveString);
            return saveData.soundEnabled !== undefined ? saveData.soundEnabled : true; // 默认开启音效
        } else {
            return true;
        }
    }

    public static saveSoundState(enabled: boolean): void {
        let saveString = sys.localStorage.getItem(this.SAVE_KEY);
        let saveData = saveString ? JSON.parse(saveString) : {};
        saveData.soundEnabled = enabled;
        sys.localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
    }
}