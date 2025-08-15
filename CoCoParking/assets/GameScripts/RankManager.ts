// RankManager.ts - 游戏主域
import { _decorator, Component, Node, Button, SubContextView } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RankManager')
export class RankManager extends Component {
    // 开放数据域容器（SubContextView组件）
    @property(SubContextView)
    rankView: SubContextView = null!;

    // 打开排行榜按钮
    @property(Button)
    openButton: Button = null!;

    // 关闭排行榜按钮
    @property(Button)
    closeButton: Button = null!;

    onLoad() {
        // 初始化时隐藏排行榜
        if (this.rankView && this.rankView.node) {
            this.rankView.node.active = false;
        }

        // 绑定按钮事件
        this.openButton.node.on(Node.EventType.TOUCH_END, this.openRanking, this);
        this.closeButton.node.on(Node.EventType.TOUCH_END, this.closeRanking, this);
    }

    // 打开排行榜
    openRanking() {
        if (!this.rankView) return;
        
        // 显示容器
        this.rankView.node.active = true;
        
        // 通知开放数据域显示排行榜
        if (typeof wx !== 'undefined') {
            const openDataContext = wx.getOpenDataContext();
            openDataContext.postMessage({
                type: 'openRanking'
            });
        }
    }

    // 关闭排行榜
    closeRanking() {
        if (!this.rankView) return;
        
        // 隐藏容器
        this.rankView.node.active = false;
        
        // 通知开放数据域关闭排行榜
        if (typeof wx !== 'undefined') {
            const openDataContext = wx.getOpenDataContext();
            openDataContext.postMessage({
                type: 'closeRanking'
            });
        }
    }
}