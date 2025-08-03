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
        const worldPos = carNode.worldPosition;
        console.log(`汽车被点击! 父节点: ${parentNode.name}, 预制名称: ${carPrefab.name}, 世界坐标: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);
            
        // 检查是否为Ux系列汽车
        if (parentNode.name.startsWith('nodeU')) {
            // 获取当前关卡地图数据
            const mapData = MapData.getMapDataByLevel(this.currentLevel);
            if (mapData) {
                const { Map, MapH } = mapData;
                // 假设x坐标对应地图列索引 (这里需要根据实际映射关系调整)
                // 简化示例: 从父节点名称提取x值，如nodeU0对应x=0
                const x = parseInt(parentNode.name.replace('nodeU', ''));
                
                // 查找最后一个为0的单元格i，并统计0的总数
                let lastZeroIndex = -1;
                let zeroCount = 0;
                
                for (let i = MapH - 1; i >= 0; i--) {
                    if (Map[i][x] === 0) {
                        lastZeroIndex = i;
                        zeroCount++;
                    }
                }
                
                // 根据汽车类型设置长度
                let carLength = 1;
                switch (type) {
                    case 1:
                        carLength = 1;
                        break;
                    case 2:
                        carLength = 2;
                        break;
                    case 3:
                        carLength = 3;
                        break;
                    default:
                        console.error(`无效的汽车类型: ${type}，默认长度为1`);
                        carLength = 1;
                        break;
                }
                
                if (zeroCount < carLength) {
                    console.log(`停车失败: 空位数量(${zeroCount})小于汽车长度(${carLength})`);
                    // 添加失败效果：短暂闪烁或播放音效
                    carNode.getComponent(Animation)?.play('park_fail');
                } else {
                    console.log(`停车成功: 找到${zeroCount}个空位`);
                    // 成功停车计数+1
                    this.successfulParks++;
                    console.log(`当前成功停车数: ${this.successfulParks}`);
                    
                    // 检查是否已停满所有汽车
                    const totalCars = MapData.getCarDataByLevel(this.currentLevel)?.length || 0;
                    if (this.successfulParks >= totalCars) {
                        console.log(`恭喜！已成功停放所有${totalCars}辆汽车，关卡完成！`);
                        // 通知GameManager关卡完成
                        // 使用find方法获取GameManager节点
                        const gameManagerNode = find('GameManager');
                        if (gameManagerNode) {
                            const gameManager = gameManagerNode.getComponent('GameManager') as any;
                            if (gameManager) {
                                console.log('成功获取GameManager引用');
                                gameManager.onLevelClear();
                            } else {
                                console.error('GameManager节点上未找到GameManager组件');
                            }
                        } else {
                            console.error('无法找到GameManager节点');
                        }
                    }
                    // 更新地图数据
                    for (let i = lastZeroIndex; i > lastZeroIndex - carLength; i--) {
                        if (i >= 0) { // 确保索引不会小于0
                            Map[i][x] = 1;
                        }
                    }
                    // 刷新地图显示
                    const mapManager = this.node.parent.getComponent('MapManager');
                    if (mapManager) {
                        (mapManager as any).updateMapDisplay();
                    }
                      
                    // 隐藏被点击的汽车
                    carNode.active = false;
                       
                    // 在UILevel/AnimNode/nodePark下创建新汽车
                    const newPos = new Vec3(worldPos.x, worldPos.y + 100 * lastZeroIndex, worldPos.z);
                    this.createNewCarAtPosition(newPos, carPrefab);
                }
            }
        } else {
            // 非Ux系列汽车，保持原有逻辑
            // 隐藏被点击的汽车
            carNode.active = false;
              
            // 在UILevel/AnimNode/nodePark下创建新汽车
            this.createNewCarAtPosition(worldPos, carPrefab);
        }
    }

    // 在指定位置创建新汽车
    private createNewCarAtPosition(worldPos: Vec3, carPrefab: Prefab) {
        // 检查UILevel节点是否存在
        if (!this.UILevel) {
            console.error('UILevel节点不存在，无法创建新汽车');
            return;
        }

        // 查找AnimNode/nodePark节点
        const animNode = this.UILevel.getChildByName('AnimNode');
        if (!animNode) {
            console.error('AnimNode节点不存在，无法创建新汽车');
            return;
        }

        const nodePark = animNode.getChildByName('nodePark');
        if (!nodePark) {
            console.error('nodePark节点不存在，无法创建新汽车');
            return;
        }

        // 计算新位置 (原始位置 + (0, 600))
        const newPos = new Vec3(worldPos.x, worldPos.y + 600, worldPos.z);

        // 实例化新汽车
        const newCar = instantiate(carPrefab);
        if (newCar) {
            // 设置父节点
            newCar.setParent(nodePark);
            // 设置位置
            newCar.worldPosition = newPos;
            console.log(`成功创建新汽车! 位置: (${newPos.x.toFixed(2)}, ${newPos.y.toFixed(2)})`);
        } else {
            console.error('实例化汽车预制体失败');
        }
    }
}