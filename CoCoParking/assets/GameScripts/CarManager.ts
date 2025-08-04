import { _decorator, Component, Node, Prefab, instantiate, Vec3, Animation, find } from 'cc';
import { MapData } from './MapData';
const { ccclass, property } = _decorator;

@ccclass('CarManager')
export class CarManager extends Component {
    @property(Node)
    public nodeCar: Node = null; // 汽车父节点

    @property(Node)
    public UILevel: Node = null; // 关卡界面节点

    @property(Prefab)
    public itemCarU1: Prefab = null; // 汽车预制1

    @property(Prefab)
    public itemCarU2: Prefab = null; // 汽车预制2

    @property(Prefab)
    public itemCarU3: Prefab = null; // 汽车预制3

    @property(Prefab)
    public itemCarL1: Prefab = null; // 汽车预制L1

    @property(Prefab)
    public itemCarL2: Prefab = null; // 汽车预制L2

    @property(Prefab)
    public itemCarL3: Prefab = null; // 汽车预制L3

    @property(Prefab)
    public itemCarR1: Prefab = null; // 汽车预制R1

    @property(Prefab)
    public itemCarR2: Prefab = null; // 汽车预制R2

    @property(Prefab)
    public itemCarR3: Prefab = null; // 汽车预制R3

    private successfulParks: number = 0; // 成功停车计数
    private currentLevel: number = 1; // 当前关卡

    // 初始化汽车
    public initCars(level: number): void {
        this.currentLevel = level;
        this.successfulParks = 0;
        console.log('成功停车计数已重置为0');

        if (!this.nodeCar) {
            console.error('nodeCar is not assigned in CarManager. Please assign the nodeCar property in the inspector.');
            return;
        }

        // 先清除所有现有汽车，但保留nodeU0-nodeU4、nodeL0-nodeL5和nodeR0-nodeR5节点
        const nodeNames = ['nodeU0', 'nodeU1', 'nodeU2', 'nodeU3', 'nodeU4', 'nodeL0', 'nodeL1', 'nodeL2', 'nodeL3', 'nodeL4', 'nodeL5', 'nodeR0', 'nodeR1', 'nodeR2', 'nodeR3', 'nodeR4', 'nodeR5'];
        for (const nodeName of nodeNames) {
            const node = this.nodeCar.getChildByName(nodeName);
            if (node) {
                node.removeAllChildren();
            } else {
                console.warn(`Cannot find node ${nodeName} under nodeCar`);
            }
        }

        // 获取当前关卡的汽车数据
        const carData = MapData.getCarDataByLevel(level);
        if (!carData || carData.length === 0) {
            console.log(`No car data for level ${level}`);
            return;
        }

        // 用于跟踪每个nodeUx、nodeLx和nodeRx节点下的汽车排序
        const nodeUSortIndex: {[key: string]: number} = {};
        // 用于跟踪每个nodeUx节点下的Y坐标偏移量
        const nodeUOffsetY: {[key: string]: number} = {};
        // 用于跟踪每个nodeLx节点下的X坐标偏移量
        const nodeLOffsetX: {[key: string]: number} = {};
        // 用于跟踪每个nodeRx节点下的X坐标偏移量
        const nodeROffsetX: {[key: string]: number} = {};
        nodeNames.forEach(name => {
            nodeUSortIndex[name] = 0;
            nodeUOffsetY[name] = 0;
            nodeLOffsetX[name] = 0;
            nodeROffsetX[name] = 0;
        });

        // 创建汽车
        for (const car of carData) {
            const {outerMap, sort, type} = car;
            const nodeName = `node${outerMap}`; // 例如: nodeU0
            const parentNode = this.nodeCar.getChildByName(nodeName);

            if (!parentNode) {
                console.error(`Cannot find parent node: ${nodeName} under nodeCar`);
                continue;
            }

            // 获取对应的汽车预制
            let carPrefab: Prefab = null;
            // 根据outerMap和type选择不同系列的预制体
            if (outerMap.startsWith('U')) {
                switch (type) {
                    case 1:
                        carPrefab = this.itemCarU1;
                        break;
                    case 2:
                        carPrefab = this.itemCarU2;
                        break;
                    case 3:
                        carPrefab = this.itemCarU3;
                        break;
                    default:
                        console.error(`Invalid car type: ${type}`);
                        continue;
                }
            } else if (outerMap.startsWith('L')) {
                switch (type) {
                    case 1:
                        carPrefab = this.itemCarL1;
                        break;
                    case 2:
                        carPrefab = this.itemCarL2;
                        break;
                    case 3:
                        carPrefab = this.itemCarL3;
                        break;
                    default:
                        console.error(`Invalid car type: ${type}`);
                        continue;
                }
            } else if (outerMap.startsWith('R')) {
                switch (type) {
                    case 1:
                        carPrefab = this.itemCarR1;
                        break;
                    case 2:
                        carPrefab = this.itemCarR2;
                        break;
                    case 3:
                        carPrefab = this.itemCarR3;
                        break;
                    default:
                        console.error(`Invalid car type: ${type}`);
                        continue;
                }
            } else {
                console.error(`Invalid outerMap: ${outerMap}`);
                continue;
            }

            if (!carPrefab) {
                console.error(`Car prefab for type ${type} is not assigned`);
                continue;
            }

            // 创建汽车实例
            const carNode = instantiate(carPrefab);
            if (carNode) {
                // 设置父节点
                parentNode.addChild(carNode);
                // 记录该节点下的排序
                nodeUSortIndex[nodeName]++;
                console.log(`Created car type ${type} at ${nodeName}, sort: ${sort}`);

                // 为Ux系列汽车设置位置
                if (outerMap.startsWith('U')) {
                    // 设置位置: 第一辆为(0, 0)，后续车辆根据前一辆类型计算Y坐标
                    const currentSort = nodeUSortIndex[nodeName];
                    let posX = 0;
                    let posY = nodeUOffsetY[nodeName];

                    // 设置汽车位置
                    carNode.setPosition(new Vec3(posX, posY, 0));
                    console.log(`设置U系列汽车位置: (${posX}, ${posY})`);

                    // 更新偏移量，供下一辆汽车使用 (根据用户需求改为递减)
                    nodeUOffsetY[nodeName] -= 100 * type;
                }
                // 为Lx系列汽车设置位置
                else if (outerMap.startsWith('L')) {
                    // 设置位置: 第一辆为(0, 0)，后续车辆根据前一辆类型计算X坐标
                    const currentSort = nodeUSortIndex[nodeName];
                    let posX = nodeLOffsetX[nodeName];
                    let posY = 0;

                    // 设置汽车位置
                    carNode.setPosition(new Vec3(posX, posY, 0));
                    console.log(`设置L系列汽车位置: (${posX}, ${posY})`);

                    // 更新偏移量，供下一辆汽车使用 (根据用户需求为递增)
                    nodeLOffsetX[nodeName] += 100 * type;
                }
                // 为Rx系列汽车设置位置
                else if (outerMap.startsWith('R')) {
                    // 设置位置: 第一辆为(0, 0)，后续车辆根据前一辆类型计算X坐标
                    const currentSort = nodeUSortIndex[nodeName];
                    let posX = nodeROffsetX[nodeName];
                    let posY = 0;

                    // 设置汽车位置
                    carNode.setPosition(new Vec3(posX, posY, 0));
                    console.log(`设置R系列汽车位置: (${posX}, ${posY})`);

                    // 更新偏移量，供下一辆汽车使用 (根据用户需求为递减)
                    nodeROffsetX[nodeName] -= 100 * type;
                }

                // 设置汽车点击事件
                this.setupCarClickEvents(carNode, parentNode, carPrefab, type);
            } else {
                console.error(`Failed to instantiate car prefab for type ${type}`);
            }
        }
    }

    // 设置汽车点击事件
    private setupCarClickEvents(carNode: Node, parentNode: Node, carPrefab: Prefab, type: number) {
        // 为汽车添加触摸点击事件
        carNode.on(Node.EventType.TOUCH_END, () => {
                this.handleCarClick(carNode, parentNode, carPrefab, type);
            }, this);

        // 为汽车添加鼠标点击事件（用于桌面平台）
        carNode.on(Node.EventType.MOUSE_UP, () => {
                this.handleCarClick(carNode, parentNode, carPrefab, type);
            }, this);
    }

    // 处理汽车点击逻辑
    private handleCarClick(carNode: Node, parentNode: Node, carPrefab: Prefab, type: number) {
        // 获取汽车世界坐标
        const worldPos = carNode.worldPosition;
        
        // 获取当前关卡地图数据
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        const mapInfo = mapData ? JSON.stringify(mapData.Map) : '无地图数据';
        
        // 获取汽车的sort属性（从父节点名称中提取）
        // 假设父节点名称格式为nodeUx、nodeLx或nodeRx
        const sort = parseInt(parentNode.name.replace(/[^0-9]/g, ''));
        
        // 打印所需信息
        console.log(`汽车被点击!`);
        console.log(`- 父节点: ${parentNode.name}`);
        console.log(`- type: ${type}`);
        console.log(`- sort: ${sort}`);
        console.log(`- 世界坐标: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);
        console.log(`- map: ${mapInfo}`);
    }


}