// LevelDataManager.ts - 游戏主域
import { _decorator, Component, sys } from 'cc';
const { ccclass } = _decorator;

@ccclass('LevelDataManager')
export class LevelDataManager extends Component {
    // 玩家的最大通关关卡（存储在本地和云端）
    private _maxLevel: number = 0;
    
    onLoad() {
        // 从本地缓存加载数据
        this.loadLocalData();
    }
    
    get maxLevel(): number {
        return this._maxLevel;
    }
    
    set maxLevel(level: number) {
        if (level > this._maxLevel) {
            this._maxLevel = level;
            this.saveData();
        }
    }
    
    // 加载本地数据
    private loadLocalData() {
        const saved = sys.localStorage.getItem('level_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this._maxLevel = data.maxLevel || 0;
            } catch (e) {
                console.error('解析本地数据失败', e);
            }
        }
    }
    
    // 保存数据到本地和云端
    private saveData() {
        // 保存到本地缓存
        sys.localStorage.setItem('level_data', JSON.stringify({
            maxLevel: this._maxLevel
        }));
        
        // 提交到微信云存储
        if (typeof wx !== 'undefined') {
            wx.setUserCloudStorage({
                KVDataList: [{
                    key: "maxLevel",
                    value: this._maxLevel.toString()
                }],
                success: () => console.log("关卡数据提交成功"),
                fail: (err) => console.error("关卡数据提交失败", err)
            });
        }
    }
    
    // 玩家通关时的调用
    public levelCompleted(level: number) {
        if (level > this._maxLevel) {
            this.maxLevel = level;
        }
    }
}