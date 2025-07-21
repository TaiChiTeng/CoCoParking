import { _decorator, Component, Node, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Rank')
export class Rank extends Component {
    private readonly DAILY_SCORE_KEY = "daily_score";
    private readonly DAILY_ROUGELITE_KEY = "daily_rouge_score";
    private readonly STORE_VERSION = 10;

    localStorageData = {version: this.STORE_VERSION, date: "0000-0-0", history: 0, dailyHistory:0, scoreRate: 0}
    localRougeliteStorageData = {version: this.STORE_VERSION, date: "0000-0-0", history: 0, dailyHistory:0, scoreRate: 0}

    userInfo = {avatarUrl:"", nickname:"你"}

    start() {
        if (sys.platform == "WECHAT_GAME") {
            wx.showShareMenu({menus: ['shareAppMessage', 'shareTimeline']});
            wx.onShareAppMessage(function () {
                return {
                    title: "一起来投篮吧！"
                };
            });
            wx.onShareTimeline(function () {
                return {
                    title: "一起来投篮吧！"
                };
            });
        }
        this.localStorageData = this.loadLocalStorage(false);
        this.localRougeliteStorageData = this.loadLocalStorage(true);
    }

    loadUserInfo() {
    }

    getHistoryHighScore(isRougelite:boolean) :number {
        return isRougelite ? this.localRougeliteStorageData.history : this.localStorageData.history;
    }

    loadLocalStorage(isRougelite:boolean) : any {
        const savedData = sys.localStorage.getItem(isRougelite ? this.DAILY_ROUGELITE_KEY : this.DAILY_SCORE_KEY);
        if (savedData) {
            try {
                let loadedData = JSON.parse(savedData);
                if (loadedData.version == this.STORE_VERSION) {
                    return loadedData;
                }
            }
            catch (e) {
                console.log("读取本地存储失败，使用默认值", e);
            }
        }
        return isRougelite ? this.localRougeliteStorageData : this.localStorageData;
    }

    update(deltaTime: number) {
        
    }
    
    getChinaDate() : Date {
        const now = new Date();
        const utcTime = now.getTime() + now.getTimezoneOffset() * 60000; // 转UTC时间戳
        const chinaOffset = 8; // 中国UTC+8
        return new Date(utcTime + chinaOffset * 3600000);
    }
    
    getCurrentDate(): string {
        const now = new Date();
        
        const chinaOffset = 8 * 60;
        const totalOffset = (chinaOffset) * 60 * 1000;
        const chinaTime = new Date(now.getTime() + totalOffset);
        
        const year = chinaTime.getUTCFullYear();
        const month = (chinaTime.getUTCMonth() + 1).toString();
        const day = chinaTime.getUTCDate().toString();
        
        return `${year}-${month}-${day}`;
    }

    updateScoreLocal(newScore: number, scoreRate: number, isRougelite:boolean) {
        let currentDate = this.getCurrentDate();
        let storageData = isRougelite ? this.localRougeliteStorageData : this.localStorageData;
        if (storageData.version != this.STORE_VERSION || storageData.date != currentDate){
            storageData.dailyHistory = 0;
        }
        if (storageData.history < newScore || storageData.dailyHistory < newScore) {
            storageData.version = this.STORE_VERSION;
            storageData.date = currentDate;
            storageData.history = Math.max(newScore, storageData.history);
            storageData.dailyHistory = Math.max(newScore, storageData.dailyHistory);
            storageData.scoreRate = scoreRate;
            sys.localStorage.setItem(isRougelite ? this.DAILY_ROUGELITE_KEY : this.DAILY_SCORE_KEY, JSON.stringify(storageData));
        }
    }

    updateScore(newScore: number, scoreRate: number, isRougelite:boolean) {  
        this.updateScoreLocal(newScore, scoreRate, isRougelite);
        if (sys.platform == "WECHAT_GAME") {
            const currentDate = this.getCurrentDate();
            
            let storageData = isRougelite ? this.localRougeliteStorageData : this.localStorageData;
            let openDataContext = wx.getOpenDataContext();
            openDataContext.postMessage({
                type: "engine",
                event: "updateScore",
                cloudStorageVersion: this.STORE_VERSION,
                cloudStorageKey: isRougelite ? this.DAILY_ROUGELITE_KEY : this.DAILY_SCORE_KEY,
                scoreDate: currentDate,
                historyHighScore: storageData.dailyHistory,
                scoreRate: scoreRate
            });
        }
    }

    updateRank(isRougelite:boolean) {
        if (sys.platform == "WECHAT_GAME") {
            const currentDate = this.getCurrentDate();
            
            let openDataContext = wx.getOpenDataContext();
            openDataContext.postMessage({
                type: "engine",
                event: "updateRank",
                cloudStorageVersion: this.STORE_VERSION,
                cloudStorageKey: isRougelite ? this.DAILY_ROUGELITE_KEY : this.DAILY_SCORE_KEY,
                scoreDate: currentDate
            });
        }
    }
}


