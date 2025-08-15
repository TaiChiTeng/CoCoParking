// LevelRankItem.ts - 开放数据域
import { _decorator, Component, Label, Sprite, Texture2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LevelRankItem')
export class LevelRankItem extends Component {
    @property(Label)
    rankLabel: Label = null!;

    @property(Label)
    nameLabel: Label = null!;
    
    @property(Label)
    levelLabel: Label = null!;
    
    @property(Sprite)
    avatar: Sprite = null!;
    
    public initItem(data: any) {
        // 设置排名文本
        this.rankLabel.string = `${data.rank}`;
        
        // 设置玩家名称
        this.nameLabel.string = data.isSelf ? `${data.nickname} (我)` : data.nickname;
        
        // 设置通关关卡
        this.levelLabel.string = `通关: ${data.maxLevel}关`;
        
        // 高亮显示自己
        if (data.isSelf) {
            this.nameLabel.color.set(255, 200, 0, 255); // 金色显示
        }
        
        // 加载头像
        this.loadAvatar(data.avatar);
    }
    
    private loadAvatar(url: string) {
        if (!url) return;
        
        const image = wx.createImage();
        image.src = url;
        image.onload = () => {
            const texture = new Texture2D();
            texture.image = image;
            this.avatar.spriteFrame!.texture = texture;
        };
    }
}