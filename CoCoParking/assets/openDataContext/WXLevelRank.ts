// WXLevelRank.ts - 开放数据域
import { _decorator, Component, Prefab, instantiate, ScrollView } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WXLevelRank')
export class WXLevelRank extends Component {
    @property(ScrollView)
    scrollView: ScrollView = null!;
    
    @property(Prefab)
    rankItemPrefab: Prefab = null!;
    
    // 当前用户的ID（用于高亮显示）
    private selfOpenID: string = '';

    onLoad() {
        // 获取自己的OpenID
        wx.getUserInfo({
            openIdList: ['selfOpenId'],
            lang: 'zh_CN',
            success: (res) => {
                this.selfOpenID = res.data[0]?.openId || '';
                this.loadRankingData();
            },
            fail: () => this.loadRankingData()
        });

        // 监听主域消息
        wx.onMessage(data => {
            if (data.type === 'openRanking') {
                this.node.active = true;
            } else if (data.type === 'closeRanking') {
                this.node.active = false;
            }
        });
    }
    
    // 加载排行榜数据
    private loadRankingData() {
        // 从好友云端存储获取maxLevel数据
        wx.getFriendCloudStorage({
            keyList: ["maxLevel"],
            success: (res) => {
                const rankData = this.processRankingData(res.data);
                this.renderRankingList(rankData);
            },
            fail: (err) => console.error("获取排行榜数据失败", err)
        });
    }
    
    // 处理排行榜数据
    private processRankingData(data: any[]): any[] {
        // 添加自己的OpenID
        return data.map(item => {
            const maxLevel = parseInt(item.KVDataList.find(d => d.key === "maxLevel")?.value || "0");
            return {
                openId: item.openid,
                nickname: item.nickname || "未知玩家",
                avatar: item.avatarUrl || "",
                maxLevel,
                isSelf: item.openid === this.selfOpenID
            };
        })
        .sort((a, b) => b.maxLevel - a.maxLevel) // 按通关关卡降序排列
        .map((item, index) => ({
            ...item,
            rank: index + 1
        }));
    }
    
    // 渲染排行榜列表
    private renderRankingList(data: any[]) {
        // 清空列表
        this.scrollView.content!.removeAllChildren();
        
        // 只显示前50名
        const displayData = data.slice(0, 50);
        
        // 创建新列表项
        displayData.forEach(item => {
            const itemNode = instantiate(this.rankItemPrefab);
            this.scrollView.content!.addChild(itemNode);
            itemNode.emit('initItem', item);
        });
    }
}