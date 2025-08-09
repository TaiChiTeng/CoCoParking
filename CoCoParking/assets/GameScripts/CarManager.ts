import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { MapData } from './MapData';
const { ccclass, property } = _decorator;

// 汽车位置策略接口
interface CarPositionStrategy {
    calculatePosition(sortIndex: number, type: number): Vec3;
    updateOffset(type: number): void;
}

// 汽车停放信息接口
interface CarParkingInfo {
    outerMap: string;
    sort: number;
    type: number;
    headMap: number;
    tailMap: number;
    node: Node;
}

// 上方向汽车位置策略
class UpperCarPositionStrategy implements CarPositionStrategy {
    private offsetY: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        const posX = 0;
        const posY = this.offsetY;
        return new Vec3(posX, posY, 0);
    }

    updateOffset(type: number): void {
        this.offsetY -= 100 * type;
    }
}

// 左方向汽车位置策略
class LeftCarPositionStrategy implements CarPositionStrategy {
    private offsetX: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        const posX = this.offsetX;
        const posY = 0;
        return new Vec3(posX, posY, 0);
    }

    updateOffset(type: number): void {
        this.offsetX += 100 * type;
    }
}

// 右方向汽车位置策略
class RightCarPositionStrategy implements CarPositionStrategy {
    private offsetX: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        const posX = this.offsetX;
        const posY = 0;
        return new Vec3(posX, posY, 0);
    }

    updateOffset(type: number): void {
        this.offsetX -= 100 * type;
    }
}

@ccclass('CarManager')
export class CarManager extends Component {
    @property(Node)
    public nodeCar: Node = null; // 汽车父节点

    @property(Prefab)
    public itemCarU1: Prefab = null; // 上方向汽车预制1

    @property(Prefab)
    public itemCarU2: Prefab = null; // 上方向汽车预制2

    @property(Prefab)
    public itemCarU3: Prefab = null; // 上方向汽车预制3

    @property(Prefab)
    public itemCarL1: Prefab = null; // 左方向汽车预制1

    @property(Prefab)
    public itemCarL2: Prefab = null; // 左方向汽车预制2

    @property(Prefab)
    public itemCarL3: Prefab = null; // 左方向汽车预制3

    @property(Prefab)
    public itemCarR1: Prefab = null; // 右方向汽车预制1

    @property(Prefab)
    public itemCarR2: Prefab = null; // 右方向汽车预制2

    @property(Prefab)
    public itemCarR3: Prefab = null; // 右方向汽车预制3

    private successfulParks: number = 0; // 成功停车计数
    private currentLevel: number = 1; // 当前关卡
    private positionStrategies: {[key: string]: CarPositionStrategy} = {};
    private nodeSortIndexes: {[key: string]: number} = {};
    private carParkingInfos: CarParkingInfo[] = []; // 存储所有汽车的停放信息

    // 初始化汽车
    public initCars(level: number): void {
        this.currentLevel = level;
        this.successfulParks = 0;
        this.carParkingInfos = []; // 清空汽车停放信息
        console.log('成功停车计数已重置为0');

        if (!this.nodeCar) {
            console.error('nodeCar is not assigned in CarManager. Please assign the nodeCar property in the inspector.');
            return;
        }

        // 初始化节点名称列表
        const nodeNames = ['nodeU0', 'nodeU1', 'nodeU2', 'nodeU3', 'nodeU4', 'nodeL0', 'nodeL1', 'nodeL2', 'nodeL3', 'nodeL4', 'nodeL5', 'nodeR0', 'nodeR1', 'nodeR2', 'nodeR3', 'nodeR4', 'nodeR5'];

        // 清除现有汽车并初始化策略和索引
        this.clearExistingCars(nodeNames);
        this.initializeStrategiesAndIndexes(nodeNames);

        // 获取当前关卡的汽车数据
        const carData = MapData.getCarDataByLevel(level);
        if (!carData || carData.length === 0) {
            console.log(`No car data for level ${level}`);
            return;
        }

        // 创建汽车
        for (const car of carData) {
            this.createCar(car);
        }
    }

    // 清除现有汽车
    private clearExistingCars(nodeNames: string[]): void {
        for (const nodeName of nodeNames) {
            const node = this.nodeCar.getChildByName(nodeName);
            if (node) {
                node.removeAllChildren();
            } else {
                console.warn(`Cannot find node ${nodeName} under nodeCar`);
            }
        }
    }

    // 初始化位置策略和节点索引
    private initializeStrategiesAndIndexes(nodeNames: string[]): void {
        this.positionStrategies = {};
        this.nodeSortIndexes = {};

        for (const nodeName of nodeNames) {
            this.nodeSortIndexes[nodeName] = 0;

            if (nodeName.includes('U')) {
                this.positionStrategies[nodeName] = new UpperCarPositionStrategy();
            } else if (nodeName.includes('L')) {
                this.positionStrategies[nodeName] = new LeftCarPositionStrategy();
            } else if (nodeName.includes('R')) {
                this.positionStrategies[nodeName] = new RightCarPositionStrategy();
            }
        }
    }

    // 创建单个汽车
    private createCar(car: {outerMap: string, sort: number, type: number}): void {
        const {outerMap, sort, type} = car;
        const nodeName = `node${outerMap}`; // 例如: nodeU0
        const parentNode = this.nodeCar.getChildByName(nodeName);

        if (!parentNode) {
            console.error(`Cannot find parent node: ${nodeName} under nodeCar`);
            return;
        }

        // 获取对应的汽车预制
        const carPrefab = this.getCarPrefab(outerMap, type);
        if (!carPrefab) {
            return;
        }

        // 创建汽车实例
        const carNode = instantiate(carPrefab);
        if (!carNode) {
            console.error(`Failed to instantiate car prefab for type ${type}`);
            return;
        }

        // 设置父节点
        parentNode.addChild(carNode);

        // 更新排序索引
        this.nodeSortIndexes[nodeName]++;
        console.log(`Created car type ${type} at ${nodeName}, sort: ${this.nodeSortIndexes[nodeName]}`);

        // 设置汽车位置
        this.setCarPosition(nodeName, carNode, type);

        // 计算并存储汽车停放信息
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        let headMap = 0;
        let tailMap = 0;

        if (outerMap.startsWith('U')) {
            // Ux汽车，假设地图是垂直方向，所以headMap是地图高度-1，tailMap是headMap+type-1
            const mapH = mapData.MapH;
            headMap = mapH; 
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith('L')) {
            // Lx汽车
            const mapW = mapData.MapW;
            headMap = mapW;
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith('R')) {
            // Rx汽车
            headMap = -1;
            tailMap = headMap - type + 1;
        }

        // 考虑sort位置
        if (sort > 0) {
            if (outerMap.startsWith('U')) {
                // 上方向汽车，sort越大越靠下
                const prevInfo = this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort - 1);
                if (prevInfo) {
                    headMap = prevInfo.tailMap + 1;
                    tailMap = headMap + type - 1;
                }
            } else if (outerMap.startsWith('L')) {
                // 左方向汽车，sort越大越靠右
                const prevInfo = this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort - 1);
                if (prevInfo) {
                    headMap = prevInfo.tailMap + 1;
                    tailMap = headMap + type - 1;
                }
            } else if (outerMap.startsWith('R')) {
                // 右方向汽车，sort越大越靠左
                const prevInfo = this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort - 1);
                if (prevInfo) {
                    headMap = prevInfo.tailMap - 1;
                    tailMap = headMap - type + 1;
                }
            }
        }

        // 存储汽车停放信息
        const parkingInfo = {
            outerMap,
            sort,
            type,
            headMap,
            tailMap,
            node: carNode
        };
        this.carParkingInfos.push(parkingInfo);
        console.log('存储汽车停放信息:', parkingInfo);

        // 设置汽车点击事件
        this.setupCarClickEvents(carNode, parentNode, type, sort);
    }

    // 获取汽车预制体
    private getCarPrefab(outerMap: string, type: number): Prefab | null {
        // 根据outerMap和type选择不同系列的预制体
        if (outerMap.startsWith('U')) {
            switch (type) {
                case 1: return this.itemCarU1;
                case 2: return this.itemCarU2;
                case 3: return this.itemCarU3;
                default: console.error(`Invalid car type: ${type}`); return null;
            }
        } else if (outerMap.startsWith('L')) {
            switch (type) {
                case 1: return this.itemCarL1;
                case 2: return this.itemCarL2;
                case 3: return this.itemCarL3;
                default: console.error(`Invalid car type: ${type}`); return null;
            }
        } else if (outerMap.startsWith('R')) {
            switch (type) {
                case 1: return this.itemCarR1;
                case 2: return this.itemCarR2;
                case 3: return this.itemCarR3;
                default: console.error(`Invalid car type: ${type}`); return null;
            }
        } else {
            console.error(`Invalid outerMap: ${outerMap}`);
            return null;
        }
    }

    // 设置汽车位置
    private setCarPosition(nodeName: string, carNode: Node, type: number): void {
        const strategy = this.positionStrategies[nodeName];
        if (!strategy) {
            console.error(`No position strategy found for node: ${nodeName}`);
            return;
        }

        const sortIndex = this.nodeSortIndexes[nodeName];
        const position = strategy.calculatePosition(sortIndex, type);
        carNode.setPosition(position);
        console.log(`设置${nodeName.charAt(4)}系列汽车位置: (${position.x}, ${position.y})`);

        // 更新偏移量
        strategy.updateOffset(type);
    }

    // 设置汽车点击事件
    private setupCarClickEvents(carNode: Node, parentNode: Node, type: number, sort: number) {
        // 为汽车添加触摸点击事件
        carNode.on(Node.EventType.TOUCH_END, () => {
                this.handleCarClick(carNode, parentNode, type, sort);
            }, this);

        // 为汽车添加鼠标点击事件（用于桌面平台）
        // carNode.on(Node.EventType.MOUSE_UP, () => {
        //         this.handleCarClick(carNode, parentNode, type, sort);
        //     }, this);
    }

    // 处理汽车点击逻辑
    private handleCarClick(carNode: Node, parentNode: Node, type: number, sort: number) {
        // 获取汽车世界坐标
        const worldPos = carNode.worldPosition;

        // 获取当前关卡地图数据
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        const mapInfo = mapData ? JSON.stringify(mapData.Map) : '无地图数据';

        const outerMap = parentNode.name.replace('node', '');

        // 查找汽车停放信息
        const parkingInfo = this.carParkingInfos.find(info => 
            info.outerMap === outerMap && 
            info.sort === sort && 
            info.type === type
        );

        // 打印所需信息
        console.log(`汽车被点击!`);
        console.log(`- 父节点: ${parentNode.name}`);
        console.log(`- type: ${type}`);
        console.log(`- sort: ${sort}`);
        console.log(`- 世界坐标: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);
        console.log(`- map: ${mapInfo}`);
        if (parkingInfo) {
            console.log(`- 车头位置: ${parkingInfo.headMap}`);
            console.log(`- 车尾位置: ${parkingInfo.tailMap}`);
        } else {
            console.log(`- 未找到停放信息`);
        }
    }

    // 增加成功停车计数
    public incrementSuccessfulPark(): void {
        this.successfulParks++;
        console.log(`成功停车计数增加到: ${this.successfulParks}`);
    }

    // 获取成功停车计数
    public getSuccessfulParks(): number {
        return this.successfulParks;
    }

    // 设置当前关卡
    public setCurrentLevel(level: number): void {
        this.currentLevel = level;
    }

    // 获取当前关卡
    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    // 根据outerMap和sort获取汽车停放信息
    public getCarParkingInfo(outerMap: string, sort: number): CarParkingInfo | null {
        return this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort);
    }
}