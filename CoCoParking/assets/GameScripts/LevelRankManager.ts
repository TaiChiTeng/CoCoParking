// LevelRankManager.ts - 游戏主域
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LevelRankManager')
export class LevelRankManager extends Component {
    // 开放数据域容器节点
    @property(Node)
    rankContainer: Node = null!;
    
    // 打开排行榜按钮
    @property(Node)
    openRankButton: Node = null!;
    
    // 关闭排行榜按钮
    @property(Node)
    closeRankButton: Node = null!;
    
    onLoad() {
        // 初始化时隐藏排行榜
        this.rankContainer.active = false;
        
        // 绑定按钮事件
        this.openRankButton.on(Node.EventType.TOUCH_END, this.openRanking, this);
        this.closeRankButton.on(Node.EventType.TOUCH_END, this.closeRanking, this);
        
        // 首次打开时初始化开放数据域
        if (typeof wx !== 'undefined') {
            const openDataContext = wx.getOpenDataContext();
            this.rankContainer.active = true; // 必须激活才能初始化
            openDataContext.postMessage({ 
                type: 'initRanking' 
            });
            this.rankContainer.active = false;
        }
    }
    
    // 打开排行榜
    openRanking() {
        if (typeof wx === 'undefined') return;
        
        this.rankContainer.active = true;
        
        // 通知开放数据域显示排行榜
        const openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage({
            type: 'openRanking'
        });
        
        // 暂停游戏
        this.scheduleOnce(() => {
            if (this.rankContainer.active) {
                director.pause();
            }
        }, 0.1);
    }
    
    // 关闭排行榜
    closeRanking() {
        this.rankContainer.active = false;
        
        // 通知开放数据域隐藏排行榜
        if (typeof wx !== 'undefined') {
            const openDataContext = wx.getOpenDataContext();
            openDataContext.postMessage({
                type: 'closeRanking'
            });
        }
        
        // 恢复游戏
        director.resume();
    }
}