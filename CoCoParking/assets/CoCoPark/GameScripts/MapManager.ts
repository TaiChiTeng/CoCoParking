import { _decorator, Component, Node } from 'cc';
import { MapData } from './MapData';
const { ccclass, property } = _decorator;

@ccclass('MapManager')
export class MapManager extends Component {
    @property(Node)
    public nodeBlock: Node = null; // 阻挡物父节点

    @property(Node)
    public UILevel: Node = null; // 关卡界面节点

    private currentLevel: number = 1; // 当前关卡

    // 设置当前关卡
    public setCurrentLevel(level: number): void {
        if (level >= 1 && level <= MapData.getTotalLevels()) {
            this.currentLevel = level;
            console.log(`Current level set to: ${level}`);

            // 当关卡改变时，重新创建地图
            this.createMap();
        } else {
            console.error(`Invalid level: ${level}. Level must be between 1 and ${MapData.getTotalLevels()}`);
        }
    }

    // 创建地图
    public createMap() {
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        
        // 清除UILevel/AnimNode/nodePark下的所有子节点
        if (this.UILevel) {
            const animNode = this.UILevel.getChildByName('AnimNode');
            if (animNode) {
                const nodePark = animNode.getChildByName('nodePark');
                if (nodePark) {
                    nodePark.removeAllChildren();
                    console.log('已清除nodePark下的所有子节点');
                } else {
                    console.error('nodePark节点不存在');
                }
            } else {
                console.error('AnimNode节点不存在');
            }
        } else {
            console.error('UILevel节点不存在');
        }

        if (!mapData || !this.nodeBlock) {
            return;
        }

        const {MapW, MapH, Map} = mapData;

        console.log(`Creating map for level ${this.currentLevel}:`);
        console.log(`MapW: ${MapW}, MapH: ${MapH}`);
        console.log('Map data:');
        for (let i = 0; i < MapH; i++) {
            console.log(Map[i].join(','));
        }

        // 根据地图数据设置阻挡物可见性
        this.updateMapDisplay();
    }

    // 更新地图显示
    public updateMapDisplay() {
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        if (!mapData || !this.nodeBlock) {
            return;
        }

        const {MapW, MapH, Map} = mapData;

        // 根据地图数据设置阻挡物可见性
        // 先隐藏所有阻挡物
        for (let i = 0; i < this.nodeBlock.children.length; i++) {
            this.nodeBlock.children[i].active = false;
        }

        // 根据地图数据显示对应的阻挡物
        // 假设子节点的顺序与地图单元格的顺序一致 (按行优先)
        let childIndex = 0;
        for (let y = 0; y < MapH; y++) {
            for (let x = 0; x < MapW; x++) {
                if (childIndex < this.nodeBlock.children.length) {
                    // 根据地图数据设置节点可见性
                    this.nodeBlock.children[childIndex].active = (Map[y][x] === -1);
                } else {
                    console.warn(`No enough block nodes. Missing node for cell (${y}, ${x})`);
                }
                childIndex++;
            }
        }

        // 如果有多余的节点，隐藏它们
        while (childIndex < this.nodeBlock.children.length) {
            this.nodeBlock.children[childIndex].active = false;
            childIndex++;
        }
    }

    // 获取当前关卡的地图数据
    public getCurrentMapData() {
        return MapData.getMapDataByLevel(this.currentLevel);
    }

    // 获取关卡总数
    public getTotalLevels() {
        return MapData.getTotalLevels();
    }
}