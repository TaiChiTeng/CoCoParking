import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween } from 'cc';
import { MapData } from './MapData';
import { UIManager } from './UIManager';
const { ccclass, property } = _decorator;

// 汽车位置策略接口
interface CarPositionStrategy {
    calculatePosition(sortIndex: number, type: number): Vec3;
    updateOffset(type: number): void;
    reset(): void;
}

// 汽车停放信息接口
interface CarParkingInfo {
    outerMap: string;
    sort: number;
    type: number;
    headMap: number;
    tailMap: number;
    node: Node;
    inPark: number; // 0: 在停车场外, 1: 在停车场内
}

// 地图数据接口
interface MapDataType {
    Map: number[][];
    MapH: number;
    MapW: number;
}

// 汽车移动状态枚举
enum CarMovementStatus {
    CANNOT_MOVE,           // 无法移动
    CAN_MOVE_UP,           // 可以向上移动
    CAN_MOVE_DOWN,         // 可以向下移动
    CAN_MOVE_DOWN_IN_PARK, // 可以向下移动（停在停车场内）
    CAN_MOVE_DOWN_OUT_PARK, // 可以向下移动（停在停车场外）
    
    Rx_CAN_MOVE_RIGHT,           // Rx可以向右移动
    Rx_CAN_MOVE_LEFT_IN_PARK,   // Rx可以向左移动（停在停车场内）
    Rx_CAN_MOVE_LEFT_OUT_PARK,  // Rx可以向左移动（停在停车场外）
    Rx_CAN_MOVE_LEFT,            // Rx可以向左移动

    Lx_CAN_MOVE_LEFT,            // Lx可以向左移动
    Lx_CAN_MOVE_RIGHT_IN_PARK,    // Lx可以向右移动（停在停车场内）
    Lx_CAN_MOVE_RIGHT_OUT_PARK,   // Lx可以向右移动（停在停车场外）
    Lx_CAN_MOVE_RIGHT,           // Lx可以向右移动
    
    PLAYING_ANIM
}

// 汽车方向枚举
enum CarDirection {
    UP = 'U',
    LEFT = 'L',
    RIGHT = 'R'
}

// 常量定义
const CONSTANTS = {
    CAR_POSITION_OFFSET: 100,
    DEFAULT_ANIM_DURATION: 0.4,
    MAX_CAR_TYPE: 3,
    MIN_CAR_TYPE: 1
} as const;

// 上方向汽车位置策略
class UpperCarPositionStrategy implements CarPositionStrategy {
    private offsetY: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        return new Vec3(0, this.offsetY, 0);
    }

    updateOffset(type: number): void {
        this.offsetY -= CONSTANTS.CAR_POSITION_OFFSET * type;
    }

    reset(): void {
        this.offsetY = 0;
    }
}

// 左方向汽车位置策略
class LeftCarPositionStrategy implements CarPositionStrategy {
    private offsetX: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        return new Vec3(this.offsetX, 0, 0);
    }

    updateOffset(type: number): void {
        this.offsetX += CONSTANTS.CAR_POSITION_OFFSET * type;
    }

    reset(): void {
        this.offsetX = 0;
    }
}

// 右方向汽车位置策略
class RightCarPositionStrategy implements CarPositionStrategy {
    private offsetX: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        return new Vec3(this.offsetX, 0, 0);
    }

    updateOffset(type: number): void {
        this.offsetX -= CONSTANTS.CAR_POSITION_OFFSET * type;
    }

    reset(): void {
        this.offsetX = 0;
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

    @property(UIManager)
    public uiManager: UIManager = null; // UI管理器引用

    private successfulParks: number = 0;
    private currentLevel: number = 1;
    private positionStrategies: Map<string, CarPositionStrategy> = new Map();
    private nodeSortIndexes: Map<string, number> = new Map();
    private carParkingInfos: CarParkingInfo[] = [];
    private carAnimDuration: number = CONSTANTS.DEFAULT_ANIM_DURATION;
    private isAnimationPlaying: boolean = false;
    
    // 节点名称常量
    private readonly NODE_NAMES = [
        'nodeU0', 'nodeU1', 'nodeU2', 'nodeU3', 'nodeU4',
        'nodeL0', 'nodeL1', 'nodeL2', 'nodeL3', 'nodeL4', 'nodeL5',
        'nodeR0', 'nodeR1', 'nodeR2', 'nodeR3', 'nodeR4', 'nodeR5'
    ] as const;

    /**
     * 初始化汽车
     * @param level 关卡等级
     */
    public initCars(level: number): void {
        if (!this.validateLevel(level)) {
            console.error(`Invalid level: ${level}`);
            return;
        }

        if (!this.nodeCar) {
            console.error('nodeCar is not assigned in CarManager. Please assign the nodeCar property in the inspector.');
            return;
        }

        this.resetGameState(level);
        this.clearExistingCars();
        this.initializeStrategiesAndIndexes();
        
        const carData = MapData.getCarDataByLevel(level);
        if (!carData?.length) {
            console.warn(`No car data for level ${level}`);
            return;
        }

        this.createCars(carData);
    }

    /**
     * 验证关卡等级
     */
    private validateLevel(level: number): boolean {
        return Number.isInteger(level) && level > 0;
    }

    /**
     * 重置游戏状态
     */
    private resetGameState(level: number): void {
        this.currentLevel = level;
        this.successfulParks = 0;
        this.carParkingInfos = [];
        this.isAnimationPlaying = false;
        this.resetAllStrategies();
    }

    /**
     * 清除现有汽车
     */
    private clearExistingCars(): void {
        for (const nodeName of this.NODE_NAMES) {
            const node = this.nodeCar.getChildByName(nodeName);
            if (node) {
                node.removeAllChildren();
            } else {
                console.warn(`Cannot find node ${nodeName} under nodeCar`);
            }
        }
    }

    /**
     * 初始化位置策略和节点索引
     */
    private initializeStrategiesAndIndexes(): void {
        this.positionStrategies.clear();
        this.nodeSortIndexes.clear();

        for (const nodeName of this.NODE_NAMES) {
            this.nodeSortIndexes.set(nodeName, 0);
            
            const strategy = this.createPositionStrategy(nodeName);
            if (strategy) {
                this.positionStrategies.set(nodeName, strategy);
            }
        }
    }

    /**
     * 创建位置策略
     */
    private createPositionStrategy(nodeName: string): CarPositionStrategy | null {
        if (nodeName.includes('U')) {
            return new UpperCarPositionStrategy();
        } else if (nodeName.includes('L')) {
            return new LeftCarPositionStrategy();
        } else if (nodeName.includes('R')) {
            return new RightCarPositionStrategy();
        }
        console.warn(`Unknown node type for ${nodeName}`);
        return null;
    }

    /**
     * 批量创建汽车
     */
    private createCars(carData: Array<{outerMap: string, sort: number, type: number, inPark: number}>): void {
        // 按outerMap和sort排序，确保sort=0的车先创建
        const sortedCarData = carData.sort((a, b) => {
            if (a.outerMap !== b.outerMap) {
                return a.outerMap.localeCompare(b.outerMap);
            }
            return a.sort - b.sort;
        });
        
        for (const car of sortedCarData) {
            try {
                this.createCar(car);
            } catch (error) {
                console.error(`Failed to create car:`, car, error);
            }
        }
    }

    /**
     * 创建单个汽车
     */
    private createCar(car: {outerMap: string, sort: number, type: number, inPark: number}): void {
        const {outerMap, sort, type} = car;
        
        if (!this.validateCarData(car)) {
            throw new Error(`Invalid car data: ${JSON.stringify(car)}`);
        }

        const nodeName = `node${outerMap}`;
        const parentNode = this.nodeCar.getChildByName(nodeName);

        if (!parentNode) {
            throw new Error(`Cannot find parent node: ${nodeName} under nodeCar`);
        }

        const carPrefab = this.getCarPrefab(outerMap, type);
        if (!carPrefab) {
            throw new Error(`Cannot get car prefab for ${outerMap}, type ${type}`);
        }

        const carNode = instantiate(carPrefab);
        if (!carNode) {
            throw new Error(`Failed to instantiate car prefab for type ${type}`);
        }

        parentNode.addChild(carNode);
        this.updateNodeSortIndex(nodeName);
        this.setCarPosition(nodeName, carNode, type);
        
        const parkingInfo = this.calculateParkingInfo(outerMap, sort, type, carNode, car.inPark);
        this.carParkingInfos.push(parkingInfo);
        this.setupCarClickEvents(carNode, parentNode, type, sort);
    }

    /**
     * 验证汽车数据
     */
    private validateCarData(car: {outerMap: string, sort: number, type: number, inPark: number}): boolean {
        const {outerMap, sort, type} = car;
        return outerMap && 
               typeof sort === 'number' && sort >= 0 &&
               typeof type === 'number' && type >= CONSTANTS.MIN_CAR_TYPE && type <= CONSTANTS.MAX_CAR_TYPE;
    }

    /**
     * 更新节点排序索引
     */
    private updateNodeSortIndex(nodeName: string): void {
        const currentIndex = this.nodeSortIndexes.get(nodeName) || 0;
        this.nodeSortIndexes.set(nodeName, currentIndex + 1);
    }

    /**
     * 计算汽车停放信息
     */
    private calculateParkingInfo(outerMap: string, sort: number, type: number, carNode: Node, inPark: number): CarParkingInfo {
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        if (!mapData) {
            throw new Error(`Cannot get map data for level ${this.currentLevel}`);
        }

        let headMap = 0;
        let tailMap = 0;

        // 根据方向计算初始位置
        if (outerMap.startsWith(CarDirection.UP)) {
            // Ux汽车，车头在地图高度的位置，车尾则是车头位置+长度type-1
            headMap = mapData.MapH;
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith(CarDirection.LEFT)) {
            // Lx汽车，车头在地图宽度的位置，车尾则是车头位置+长度type-1
            headMap = mapData.MapW;
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith(CarDirection.RIGHT)) {
            // Rx汽车，车头在地图-1的位置，车尾则是车头位置-长度type+1
            headMap = -1;
            tailMap = headMap - type + 1;
        }

        // 考虑sort位置
        if (sort > 0) {
            const prevInfo = this.carParkingInfos.find(info => 
                info.outerMap === outerMap && info.sort === sort - 1
            );
            
            if (prevInfo) {
                // Ux，Lx汽车，如果都在停车场外，sort+1的车，车头位置=sort的车的车尾+1
                // Rx汽车，如果都在停车场外，sort+1的车，车头位置=sort的车的车尾-1
                if (outerMap.startsWith(CarDirection.UP) || outerMap.startsWith(CarDirection.LEFT)) {
                    headMap = prevInfo.tailMap + 1;
                    tailMap = headMap + type - 1;
                } else if (outerMap.startsWith(CarDirection.RIGHT)) {
                    headMap = prevInfo.tailMap - 1;
                    tailMap = headMap - type + 1;
                }
            }
        }

        return {
            outerMap,
            sort,
            type,
            headMap,
            tailMap,
            node: carNode,
            inPark: inPark
        };
    }

    /**
     * 获取汽车预制体
     */
    private getCarPrefab(outerMap: string, type: number): Prefab | null {
        const carPrefabMap = new Map([
            [`${CarDirection.UP}1`, this.itemCarU1],
            [`${CarDirection.UP}2`, this.itemCarU2],
            [`${CarDirection.UP}3`, this.itemCarU3],
            [`${CarDirection.LEFT}1`, this.itemCarL1],
            [`${CarDirection.LEFT}2`, this.itemCarL2],
            [`${CarDirection.LEFT}3`, this.itemCarL3],
            [`${CarDirection.RIGHT}1`, this.itemCarR1],
            [`${CarDirection.RIGHT}2`, this.itemCarR2],
            [`${CarDirection.RIGHT}3`, this.itemCarR3]
        ]);

        const direction = outerMap.charAt(0) as CarDirection;
        const key = `${direction}${type}`;
        const prefab = carPrefabMap.get(key);
        
        if (!prefab) {
            console.error(`No car prefab found for direction: ${direction}, type: ${type}`);
        }
        
        return prefab || null;
    }

    /**
     * 设置汽车位置
     */
    private setCarPosition(nodeName: string, carNode: Node, type: number): void {
        const strategy = this.positionStrategies.get(nodeName);
        if (!strategy) {
            throw new Error(`No position strategy found for node: ${nodeName}`);
        }

        const sortIndex = this.nodeSortIndexes.get(nodeName) || 0;
        const position = strategy.calculatePosition(sortIndex, type);
        carNode.setPosition(position);
        strategy.updateOffset(type);
    }

    /**
     * 设置汽车点击事件
     */
    private setupCarClickEvents(carNode: Node, parentNode: Node, type: number, sort: number): void {
        carNode.on(Node.EventType.TOUCH_END, () => {
            this.handleCarClick(carNode, parentNode, type, sort);
        }, this);
    }

    /**
     * 处理汽车点击事件 - 按照文档要求的文学编程风格实现
     * 当用户点击汽车时，系统需要执行一系列检查和操作。这是整个处理流程的入口点。
     */
    private handleCarClick(carNode: Node, parentNode: Node, type: number, sort: number): void {
        // 防止动画播放期间的重复点击
        if (this.isAnimationPlaying) {
            return; // 如果动画正在播放，直接返回
        }
        
        // 获取汽车的完整信息
        const rawOuterMap = parentNode.name; // 从父节点名称提取区域信息
        const outerMap = rawOuterMap.startsWith('node') ? rawOuterMap.substring(4) : rawOuterMap; // 去掉'node'前缀
        
        // console.log('点击汽车调试信息:', {
        //     outerMap: outerMap,
        //     sort: sort,
        //     type: type,
        //     parentNodeName: parentNode.name,
        //     carNodeName: carNode.name
        // });
        
        const parkingInfo = this.findCarParkingInfo(outerMap, sort, type);
        if (!parkingInfo) {
            console.error('未找到汽车停放信息');
            // console.error('未找到汽车停放信息，查找参数:', {
            //     outerMap: outerMap,
            //     sort: sort,
            //     type: type
            // });
            // console.error('当前所有汽车停放信息:', this.carParkingInfos.map(info => ({
            //     outerMap: info.outerMap,
            //     sort: info.sort,
            //     type: info.type,
            //     inPark: info.inPark,
            //     headMap: info.headMap,
            //     tailMap: info.tailMap
            // })));
            // console.error('carParkingInfos数组长度:', this.carParkingInfos.length);
            return;
        }
        
        // 获取当前地图数据
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        const map = mapData.Map;  // 注意是大写的Map
        const mapH = mapData.MapH; // 注意是大写的MapH
        const mapW = mapData.MapW; // 注意是大写的MapW
        console.log('地图数据:', map);
        console.log('停车场高度:', mapH);
        console.log('停车场宽度:', mapW);
        
        // 计算汽车可以如何移动
        const movementStatus = this.calculateCarMovementStatus(parkingInfo, mapData, outerMap);
        
        // 执行具体的移动操作
        this.executeCarMovement(carNode, parkingInfo, mapData, outerMap, movementStatus);
    }

    /**
     * 查找汽车停放信息
     */
    private findCarParkingInfo(outerMap: string, sort: number, type: number): CarParkingInfo | null {
        return this.carParkingInfos.find(info => 
            info.outerMap === outerMap && 
            info.sort === sort && 
            info.type === type
        ) || null;
    }

    /**
     * 计算汽车移动状态
     */
    private calculateCarMovementStatus(parkingInfo: CarParkingInfo, mapData: MapDataType, outerMap: string): CarMovementStatus {
        const map = mapData.Map;
        const mapH = mapData.MapH;
        const mapW = mapData.MapW;
        const x = this.getCarColumnPosition(outerMap);
        const y = this.getCarRowPosition(outerMap);
        
        // 如果是Ux汽车
        if (outerMap.startsWith(CarDirection.UP)) {
            // 首先检查是否可以向上移动
            if (this.canCarMoveUp(parkingInfo, map, x)) {
                return CarMovementStatus.CAN_MOVE_UP;
            }
            // 如果不能向上移动，检查向下移动的可能性
            return this.calculateUxDownMovementStatus(parkingInfo, map, mapH, x);
        }
        
        // 如果是Rx汽车
        if (outerMap.startsWith(CarDirection.RIGHT)) {
            // 首先检查是否可以向右移动
            if (this.RxCanCarMoveRight(parkingInfo, map, y, mapW)) {
                return CarMovementStatus.Rx_CAN_MOVE_RIGHT;
            }
            // 如果不能向右移动，检查向左移动的可能性
            return this.calculateRxLeftMovementStatus(parkingInfo, map, mapW, y);
        }
        
        // 如果是Lx汽车
        if (outerMap.startsWith(CarDirection.LEFT)) {
            // 首先检查是否可以向左移动
            if (this.LxCanCarMoveLeft(parkingInfo, map, y, mapW)) {
                return CarMovementStatus.Lx_CAN_MOVE_LEFT;
            }
            // 如果不能向左移动，检查向右移动的可能性
            return this.calculateLxRightMovementStatus(parkingInfo, map, mapW, y);
        }
        
        return CarMovementStatus.CANNOT_MOVE;
    }

    /**
     * 计算Ux汽车向下移动状态
     */
    private calculateUxDownMovementStatus(parkingInfo: CarParkingInfo, map: number[][], mapH: number, x: number): CarMovementStatus {
        // 检查阻塞条件
        const tailBelowRow = parkingInfo.tailMap + 1;
        const tailBelowBlocked = tailBelowRow < mapH && map[tailBelowRow][x] !== 0;
        const headAlreadyOutside = parkingInfo.headMap < 0;
        const carAlreadyOutside = parkingInfo.headMap >= mapH;

        if (tailBelowBlocked || headAlreadyOutside || carAlreadyOutside) {
            return CarMovementStatus.CANNOT_MOVE;
        }

        // 预测停车位置
        let carStopsOutside = true;
        for (let index = parkingInfo.tailMap + 1; index < mapH; index++) {
            if (map[index][x] !== 0) {
                console.log(`车尾会停在${index - 1}`, "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
                carStopsOutside = false;
                break;
            }
        }

        return carStopsOutside ? 
            CarMovementStatus.CAN_MOVE_DOWN_OUT_PARK : 
            CarMovementStatus.CAN_MOVE_DOWN_IN_PARK;
    }

    /**
     * 计算Rx汽车向左移动状态
     */
    private calculateRxLeftMovementStatus(parkingInfo: CarParkingInfo, map: number[][], mapW: number, y: number): CarMovementStatus {
        // 检查阻塞条件
        const tailLeftCol = parkingInfo.tailMap - 1;
        const tailLeftBlocked = tailLeftCol >= 0 && map[y][tailLeftCol] !== 0;
        const headAlreadyOutside = parkingInfo.headMap > mapW - 1;
        const carAlreadyOutside = parkingInfo.headMap < 0;

        if (tailLeftBlocked || headAlreadyOutside || carAlreadyOutside) {
            return CarMovementStatus.CANNOT_MOVE;
        }

        // 预测停车位置
        let carStopsOutside = true;
        for (let index = parkingInfo.tailMap - 1; index >= 0; index--) {
            if (map[y][index] !== 0) {
                console.log(`车尾会停在${index + 1}`, "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
                carStopsOutside = false;
                break;
            }
        }

        return carStopsOutside ? 
            CarMovementStatus.Rx_CAN_MOVE_LEFT_OUT_PARK : 
            CarMovementStatus.Rx_CAN_MOVE_LEFT_IN_PARK;
    }

    /**
     * 计算Lx汽车向右移动状态
     */
    private calculateLxRightMovementStatus(parkingInfo: CarParkingInfo, map: number[][], mapW: number, y: number): CarMovementStatus {
        // 检查阻塞条件
        const tailRightCol = parkingInfo.tailMap + 1;
        const tailRightBlocked = tailRightCol < mapW && map[y][tailRightCol] !== 0;
        const headAlreadyOutside = parkingInfo.headMap < 0;
        const carAlreadyOutside = parkingInfo.headMap >= mapW;

        if (tailRightBlocked || headAlreadyOutside || carAlreadyOutside) {
            return CarMovementStatus.CANNOT_MOVE;
        }

        // 预测停车位置
        let carStopsOutside = true;
        for (let index = parkingInfo.tailMap + 1; index < mapW; index++) {
            if (map[y][index] !== 0) {
                console.log(`车尾会停在${index - 1}`, "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
                carStopsOutside = false;
                break;
            }
        }

        return carStopsOutside ? 
            CarMovementStatus.Lx_CAN_MOVE_RIGHT_OUT_PARK : 
            CarMovementStatus.Lx_CAN_MOVE_RIGHT_IN_PARK;
    }

    /**
     * 检查汽车是否可以向上移动
     */
    private canCarMoveUp(parkingInfo: CarParkingInfo, map: number[][], x: number): boolean {
        const mapH = map.length;
        
        // 基础边界检查，如果汽车已经在停车场顶部，不能再向上移动
        if (parkingInfo.headMap === 0) {
            return false;
        }
        
        // 位置有效性检查，汽车车头上面一格是否可以停车
        const rowIndex = parkingInfo.headMap - 1;
        if (!this.isValidMapPosition(map, rowIndex, x) || map[rowIndex][x] !== 0) {
            return false;
        }
        
        // 停车场外特殊处理，汽车车头是否在停车场底部外面
        const isCarOutsidePark = parkingInfo.headMap >= mapH;
        if (isCarOutsidePark) {
            const upperPosition = parkingInfo.headMap - 1;
            if (upperPosition >= 0) {
                // 检查停车场内位置
                if (upperPosition < mapH && map[upperPosition][x] !== 0) {
                    return false;
                }
                // 检查停车场外其他汽车
                if (upperPosition >= mapH) {
                    const hasCarAbove = this.carParkingInfos.some(carInfo => 
                        carInfo.outerMap === parkingInfo.outerMap && 
                        carInfo !== parkingInfo && 
                        carInfo.headMap <= upperPosition && 
                        carInfo.tailMap >= upperPosition
                    );
                    if (hasCarAbove) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * 检查Rx汽车是否可以向右移动
     */
    private RxCanCarMoveRight(parkingInfo: CarParkingInfo, map: number[][], y: number, mapW: number): boolean {
        
        // 基础边界检查，如果汽车已经在停车场最右边，不能再向右移动
        if (parkingInfo.headMap === mapW - 1) {
            return false;
        }
        
        // 位置有效性检查，汽车车头右面一格是否可以停车
        const colIndex = parkingInfo.headMap + 1;
        if (!this.isValidMapPosition(map, y, colIndex) || map[y][colIndex] !== 0) {
            return false;
        }
        
        // 停车场外特殊处理，汽车车头是否在停车场左边外面
        const isCarOutsidePark = parkingInfo.headMap < 0;
        if (isCarOutsidePark) {
            const rightPosition = parkingInfo.headMap + 1;
            if (rightPosition >= 0) {
                // 检查停车场内位置
                if (rightPosition < mapW && map[y][rightPosition] !== 0) {
                    return false;
                }
                // 检查停车场外其他汽车
                if (rightPosition < 0) {
                    const hasCarLeft = this.carParkingInfos.some(carInfo => 
                        carInfo.outerMap === parkingInfo.outerMap && 
                        carInfo !== parkingInfo && 
                        carInfo.headMap >= rightPosition && 
                        carInfo.tailMap <= rightPosition
                    );
                    if (hasCarLeft) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * 检查Lx汽车是否可以向左移动
     */
    private LxCanCarMoveLeft(parkingInfo: CarParkingInfo, map: number[][], y: number, mapW: number): boolean {
        // 基础边界检查，如果汽车已经在停车场最左边，不能再向左移动
        if (parkingInfo.headMap === 0) {
            return false;
        }
        
        // 位置有效性检查，汽车车头左面一格是否可以停车
        const colIndex = parkingInfo.headMap - 1;
        if (!this.isValidMapPosition(map, y, colIndex) || map[y][colIndex] !== 0) {
            return false;
        }
        
        // 停车场外特殊处理，汽车车头是否在停车场左边外面
        const isCarOutsidePark = parkingInfo.headMap >= mapW;
        if (isCarOutsidePark) {
            const leftPosition = parkingInfo.headMap - 1;
            if (leftPosition >= 0) {
                // 检查停车场内位置
                if (leftPosition < mapW && map[y][leftPosition] !== 0) {
                    return false;
                }
                // 检查停车场外其他汽车
                if (leftPosition < 0) {
                    const hasCarLeft = this.carParkingInfos.some(carInfo => 
                        carInfo.outerMap === parkingInfo.outerMap && 
                        carInfo !== parkingInfo && 
                        carInfo.headMap <= leftPosition && 
                        carInfo.tailMap >= leftPosition
                    );
                    if (hasCarLeft) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * 检查地图位置是否有效
     */
    private isValidMapPosition(map: number[][], row: number, col: number): boolean {
        return row >= 0 && row < map.length && 
               col >= 0 && col < map[row].length;
    }

    /**
     * 执行汽车移动
     */
    /**
     * 移动执行分发器
     * 根据不同的CarMovementStatus分发执行向上、向下、Rx向右、Lx向左等移动操作
     */

    private executeCarMovement(
        carNode: Node, 
        parkingInfo: CarParkingInfo, 
        mapData: any, 
        outerMap: string, 
        movementStatus: CarMovementStatus
    ): void {
        const map = mapData.Map;  // 注意是大写的Map
        const mapH = mapData.MapH; // 注意是大写的MapH
        const mapW = mapData.MapW; // 注意是大写的MapW
        const x = this.getCarColumnPosition(outerMap);
        const y = this.getCarRowPosition(outerMap);
        
        switch (movementStatus) {
            case CarMovementStatus.CAN_MOVE_UP:
                this.moveCarUp(carNode, parkingInfo, map, x);
                break;
            case CarMovementStatus.CAN_MOVE_DOWN_IN_PARK:
                this.moveCarDown(carNode, parkingInfo, map, x, mapH);
                break;
            case CarMovementStatus.CAN_MOVE_DOWN_OUT_PARK:
                this.moveCarDownOutPark(carNode, parkingInfo, map, x, mapH, outerMap);
                break;
            case CarMovementStatus.Rx_CAN_MOVE_RIGHT:
                this.moveRxCarRight(carNode, parkingInfo, map, y);
                break;
            case CarMovementStatus.Rx_CAN_MOVE_LEFT_IN_PARK:
                this.moveRxCarLeft(carNode, parkingInfo, map, y);
                break;
            case CarMovementStatus.Rx_CAN_MOVE_LEFT_OUT_PARK:
                this.moveRxCarLeftOutPark(carNode, parkingInfo, map, y, outerMap);
                break;
            case CarMovementStatus.Lx_CAN_MOVE_LEFT:
                this.moveLxCarLeft(carNode, parkingInfo, map, y, mapW, outerMap);
                break;
            case CarMovementStatus.Lx_CAN_MOVE_RIGHT_IN_PARK:
                this.moveLxCarRight(carNode, parkingInfo, map, y);
                break;
            case CarMovementStatus.Lx_CAN_MOVE_RIGHT_OUT_PARK:
                this.moveLxCarRightOutPark(carNode, parkingInfo, map, y, outerMap);
                break;
            default:
                console.log('无法移动汽车');
                break;
        }
    }


    /**
     * 向上移动汽车
     */
    private moveCarUp(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number): void {
        const oldHead = parkingInfo.headMap;

        // 新的车头位置，默认是当前车头位置上面一格
        let newHeadPos = parkingInfo.headMap - 1;
        const mapH = map.length;

        // 寻找新的车头位置，尽量往停车场的顶部向上开
        for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
            if (this.isValidMapPosition(map, index, x) && map[index][x] !== 0) {
                break;
            }
            newHeadPos = index;
        }

        // 检查汽车是否有部分在停车场外
        const hasPartOutsidePark = parkingInfo.tailMap >= mapH;
        
        // 如果汽车有部分在停车场外，处理相同Ux中sort比当前车大的车一起向上移动
        if (hasPartOutsidePark) {
            this.moveSimilarCarsWithHigherSortUp(parkingInfo.outerMap, parkingInfo.sort, map, mapH);
        }

        // 更新停放信息，车头找到了，Ux的车尾总是=车头+长度-1。
        parkingInfo.headMap = newHeadPos;
        parkingInfo.tailMap = newHeadPos + parkingInfo.type - 1;

        // 打印汽车移动后的位置
        console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);

        // 更新地图数据
        this.updateMapForCarMovement(map, newHeadPos, parkingInfo.tailMap, oldHead, oldHead + parkingInfo.type - 1, x, parkingInfo.type, false);

        // 判断停车状态变化，车头是否在停车场底部外面，车尾是否在停车场底部里面
        const wasOutsidePark = oldHead >= mapH;
        const isNowInsidePark = parkingInfo.tailMap < mapH;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasOutsidePark && isNowInsidePark) {
            parkingStatusChange = 'enter';
            parkingInfo.inPark = 1;
            console.log("汽车从停车场外完全进入停车场内");
        }
        
        // 播放动画
        this.playCarMoveAnimation(carNode, new Vec3(0, CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0), parkingStatusChange);
    }

    /**
     * 向下移动汽车
     */
    private moveCarDown(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number, mapH: number): void {
        let stopIndex = mapH;

        // 检查车尾+1到mapH-1的位置：从车尾下面到停车场底部，检查是否有车阻挡
        for (let index = parkingInfo.tailMap + 1; index < mapH; index++) {
            if (this.isValidMapPosition(map, index, x) && map[index][x] !== 0) {
                stopIndex = index;
                break;
            }
        }

        const oldHead = parkingInfo.headMap;
        const oldTail = parkingInfo.tailMap;
        
        // 汽车停在停车场内，找到车尾了，Ux的车尾总是=车头+长度-1，那么车头=车尾-长度+1
        parkingInfo.tailMap = stopIndex - 1;
        parkingInfo.headMap = parkingInfo.tailMap - parkingInfo.type + 1;
            
        // 更新地图数据
        this.updateMapForCarMovement(map, parkingInfo.headMap, parkingInfo.tailMap, oldHead, oldTail, x, parkingInfo.type, false);

        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.headMap - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(0, moveDistance, 0));
    }

    /**
     * Rx汽车向右移动
     */
    private moveRxCarRight(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], y: number): void {
        console.log(`=== 开始移动Rx汽车${parkingInfo.outerMap}sort${parkingInfo.sort} ===`);
        const oldHead = parkingInfo.headMap;
        // 计算新车头位置，默认是当前车头位置右面一格
        let newHeadPos = parkingInfo.headMap + 1;
        const mapW = map[0].length;

        // 寻找新的车头位置，尽量往停车场的右端向右开
        for (let index = parkingInfo.headMap + 1; index < mapW; index++) {
            if (this.isValidMapPosition(map, y, index) && map[y][index] !== 0) {
                break;
            }
            newHeadPos = index;
        }
        
        // 检查汽车是否有部分在停车场外
        const hasPartOutsidePark = parkingInfo.tailMap < 0;
        
        // 如果汽车有部分在停车场外，处理相同Rx中sort比当前车大的车一起向上移动
        if (hasPartOutsidePark) {
            this.moveRxSimilarCarsWithHigherSortRight(parkingInfo.outerMap, parkingInfo.sort, map, mapW);
        }

        // 更新停放信息，车头找到了，Rx的车尾总是=车头-长度+1。
        parkingInfo.headMap = newHeadPos;
        parkingInfo.tailMap = newHeadPos - parkingInfo.type + 1;

        // 打印汽车移动后的位置
        console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);

        // 更新地图数据
        this.updateMapForCarMovement(map, newHeadPos, parkingInfo.tailMap, oldHead, oldHead - parkingInfo.type + 1, y, parkingInfo.type, false);

        // 判断停车状态变化，车头是否在停车场左端外面，车尾是否在停车场左端里面
        const wasOutsidePark = oldHead < 0;
        const isNowInsidePark = parkingInfo.tailMap >= 0;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasOutsidePark && isNowInsidePark) {
            parkingStatusChange = 'enter';
            parkingInfo.inPark = 1;
            console.log("汽车从停车场外完全进入停车场内");
        }
        
        // 播放动画
        this.playCarMoveAnimation(carNode, new Vec3(-CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0, 0), parkingStatusChange);
    }

    /**
     * Rx汽车向左移动到停车场内
     */
    private moveRxCarLeft(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], y: number): void {
        console.log(`Rx汽车${parkingInfo.outerMap}sort${parkingInfo.sort}向左移动到停车场内`);

        // 寻找停车位置，检查车尾-1到0的位置：从车尾左面到停车场左端，检查是否有车阻挡
        let stopIndex = -1;
        for (let index = parkingInfo.tailMap - 1; index >= 0; index--) {
            if (map[y][index] !== 0) {
                stopIndex = index + 1;
                break;
            }
        }
        
        const oldHead = parkingInfo.headMap;
        const oldTail = parkingInfo.tailMap;
        
        // 更新汽车位置，找到车尾了，Rx的车尾总是=车头-长度+1，那么车头=车尾+长度-1
        parkingInfo.tailMap = stopIndex;
        parkingInfo.headMap = stopIndex + parkingInfo.type - 1;
        
        // 更新地图
        this.updateMapForCarMovement(map, parkingInfo.headMap, parkingInfo.tailMap, oldHead, oldTail, y, parkingInfo.type, true);
        
        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (oldTail - parkingInfo.tailMap);
        this.playCarMoveAnimation(carNode, new Vec3(moveDistance, 0, 0));
    }

    /**
     * Rx汽车向左移出停车场
     */
    private moveRxCarLeftOutPark(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], y: number, outerMap: string): void {
        console.log(`Rx汽车${parkingInfo.outerMap}sort${parkingInfo.sort}向左移出停车场`);
        
        const oldHead = parkingInfo.headMap;
        const oldTail = parkingInfo.tailMap;
        
        // 汽车停在停车场外，车头肯定刚好在停车场左部左面一格，Rx的车尾总是=车头-长度+1。
        parkingInfo.headMap = -1;
        parkingInfo.tailMap = -parkingInfo.type;
        
        // 清除原位置，旧车尾到旧车头，是递减的哦，反过来就是递增
        for (let i = oldTail; i <= oldHead; i++) {
            if (this.isValidMapPosition(map, y, i)) {
                map[y][i] = 0;
            }
        }
        console.log('Rx汽车向左移出停车场A');
        // 移动相同Rx且Sort比它大的车，确保相邻
        this.moveRxSimilarCarsWithHigherSortLeft(outerMap, parkingInfo.sort, map, parkingInfo.tailMap);
        console.log('Rx汽车向左移出停车场B');
        // 更新停车状态变化 - 撤出停车场
        parkingInfo.inPark = 0;
        
        // 播放动画
        const moveDistance = CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.headMap - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(moveDistance, 0, 0), 'exit');
    }

    /**
     * Lx汽车向左移动
     */
    private moveLxCarLeft(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], y: number, mapW: number, outerMap: string): void {
        console.log(`=== 开始移动Lx汽车${parkingInfo.outerMap}sort${parkingInfo.sort} ===`);
        
        // 计算新车头位置，默认是当前车头位置左面一格
        let newHeadPosition = parkingInfo.headMap - 1;

        // 寻找新的车头位置，尽量往停车场的左部向左开
        for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
            if (this.isValidMapPosition(map, y, index) && map[y][index] !== 0) {
                break;
            }
            newHeadPosition = index;
        }
        
        const oldHead = parkingInfo.headMap;
        const oldTail = parkingInfo.tailMap;
        
        // 更新汽车位置，车头找到了，Lx的车尾总是=车头+长度-1。
        parkingInfo.headMap = newHeadPosition;
        parkingInfo.tailMap = newHeadPosition + parkingInfo.type - 1;
        
        // 连带移动检查，如果汽车有部分在停车场外，处理相同Lx中sort比当前车大的车一起向左移动
        const hasPartOutsidePark = oldTail >= mapW;
        if (hasPartOutsidePark) {
            this.moveLxSimilarCarsWithHigherSortLeft(outerMap, parkingInfo.sort, map, mapW);
        }
        
        // 更新地图
        this.updateMapForCarMovement(map, parkingInfo.headMap, parkingInfo.tailMap, oldHead, oldTail, y, parkingInfo.type);
        
        // 判断停车状态变化，车头是否在停车场右部外面，车尾是否在停车场右部里面
        const wasOutsidePark = oldHead >= mapW;
        const isNowInsidePark = parkingInfo.tailMap < mapW;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasOutsidePark && isNowInsidePark) {
            parkingStatusChange = 'enter';
            parkingInfo.inPark = 1;
        }
        
        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPosition);
        this.playCarMoveAnimation(carNode, new Vec3(moveDistance, 0, 0), parkingStatusChange);
    }

    /**
     * Lx汽车向右移动到停车场内
     */
    private moveLxCarRight(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], y: number): void {
        console.log(`Lx汽车${parkingInfo.outerMap}sort${parkingInfo.sort}向右移动到停车场内`);
        
        const mapW = map[0].length;
        
        // 寻找停车位置，检查车尾+1到mapW-1的位置：从车尾右面到停车场右端，检查是否有车阻挡
        let stopIndex = mapW;
        for (let index = parkingInfo.tailMap + 1; index < mapW; index++) {
            if (map[y][index] !== 0) {
                stopIndex = index - 1;
                break;
            }
        }
        
        const oldHead = parkingInfo.headMap;
        const oldTail = parkingInfo.tailMap;
        
        // 更新汽车位置，找到车尾了，Lx的车尾总是=车头+长度-1，那么车头=车尾-长度+1
        parkingInfo.tailMap = stopIndex;
        parkingInfo.headMap = stopIndex - parkingInfo.type + 1;
        
        // 更新地图
        this.updateMapForCarMovement(map, parkingInfo.headMap, parkingInfo.tailMap, oldHead, oldTail, y, parkingInfo.type);
        
        // 播放动画
        const moveDistance = CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.tailMap - oldTail);
        this.playCarMoveAnimation(carNode, new Vec3(moveDistance, 0, 0));
    }

    /**
     * Lx汽车向右移出停车场
     */
    private moveLxCarRightOutPark(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], y: number, outerMap: string): void {
        console.log(`Lx汽车${parkingInfo.outerMap}sort${parkingInfo.sort}向右移出停车场`);
        
        const mapW = map[0].length;
        const oldHead = parkingInfo.headMap;
        const oldTail = parkingInfo.tailMap;
        
        // 汽车停在停车场外，车头肯定刚好在停车场右端右面一格，Lx的车尾总是=车头+长度-1。
        parkingInfo.headMap = mapW;
        parkingInfo.tailMap = mapW + parkingInfo.type - 1;
        
        // 清除原位置，旧车头到旧车尾，是递增的
        for (let i = oldHead; i <= oldTail; i++) {
            if (this.isValidMapPosition(map, y, i)) {
                map[y][i] = 0;
            }
        }
        
        // 移动相同Lx且Sort比它大的车，确保相邻
        this.moveLxSimilarCarsWithHigherSortRight(outerMap, parkingInfo.sort, map, parkingInfo.tailMap);
        
        // 更新停车状态变化 - 撤出停车场
        parkingInfo.inPark = 0;
        
        // 播放动画
        const moveDistance = CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.headMap - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(moveDistance, 0, 0), 'exit');
    }

    /**
     * 向下移动汽车到停车场外
     */
    private moveCarDownOutPark(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number, mapH: number, outerMap: string): void {
        const oldHead = parkingInfo.headMap;
        const oldTail = parkingInfo.tailMap;
        
        // 汽车停在停车场外，车头肯定刚好在停车场底部下面一格，Ux的车尾总是=车头+长度-1。
        parkingInfo.headMap = mapH;
        parkingInfo.tailMap = mapH + parkingInfo.type - 1;
        
        // 打印汽车移动后的位置
        console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);
        
        // 清除原位置，旧车头到旧车尾，是递增的
        for (let i = oldHead; i <= oldTail; i++) {
            if (this.isValidMapPosition(map, i, x)) {
                map[i][x] = 0;
            }
        }
        
        // 移动相同Ux且Sort比它大的车，确保相邻
        this.moveSimilarCarsWithHigherSortDown(outerMap, parkingInfo.sort, map, parkingInfo.tailMap);
        
        // 更新停车状态变化 - 撤出停车场
        parkingInfo.inPark = 0;
        
        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.headMap - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(0, moveDistance, 0), 'exit');
    }

    /**
     * 移动相同Ux中sort比当前车大的车一起向上移动（但sort+1的车是不进入停车场的）
     */
    private moveSimilarCarsWithHigherSortUp(outerMap: string, currentSort: number, map: number[][], mapH: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同outerMap且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        
        // 移动这些车（尽量向上移动但不进入停车场）
        for (const carToMove of carsToMove) {
            const oldHead = carToMove.headMap;
            
            // 尽量向上移动：从当前车头-1开始向上遍历，找到最远的可移动位置
            let newHeadPos = carToMove.headMap;
            for (let index = carToMove.headMap - 1; index >= mapH; index--) {
                // 检查这个位置及后续位置是否都可用
                let canMove = true;
                for (let checkPos = index; checkPos < index + carToMove.type; checkPos++) {
                    if (this.isValidMapPosition(map, checkPos, x) && map[checkPos][x] !== 0) {
                        canMove = false;
                        break;
                    }
                }
                
                if (canMove) {
                    newHeadPos = index;
                } else {
                    break;
                }
            }
            
            // 如果没有找到更好的位置，至少确保不进入停车场
            newHeadPos = Math.max(mapH, newHeadPos);
            
            // 清除原位置
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, i, x)) {
                    map[i][x] = 0;
                }
            }
            
            // 更新停放信息，找到车头，Ux的车尾总是=车头+长度-1。
            carToMove.headMap = newHeadPos;
            carToMove.tailMap = newHeadPos + carToMove.type - 1;
            
            // 设置新位置
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, i, x)) {
                    map[i][x] = carToMove.sort;
                }
            }
            
            // 打印移动信息
            console.log(`相关车辆尽量向上移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                this.playCarMoveAnimation(carToMove.node, new Vec3(0, CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0), 'none');
            }
        }
    }

    /**
     * Ux汽车向下连带移动
     */
    private moveSimilarCarsWithHigherSortDown(outerMap: string, currentSort: number, map: number[][], currentCarTailMap: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同Ux且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        // 按sort排序，确保按顺序移动
        carsToMove.sort((a, b) => a.sort - b.sort);
        
        // 移动这些车，确保与当前车相邻，下一辆车的车头=当前车的车尾+1，即当前车车尾的下面一格
        let nextHeadPosition = currentCarTailMap + 1;
        
        for (const carToMove of carsToMove) {
            const oldHead = carToMove.headMap;
            const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
            
            // 从地图上清除原位置
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, i, x)) {
                    map[i][x] = 0;
                }
            }
            
            // 更新停放信息，确保与当前车相邻，下一辆车的车头=当前车的车尾+1，即当前车车尾的下面一格
            // Ux的车尾总是=车头+长度-1
            carToMove.headMap = nextHeadPosition;
            carToMove.tailMap = nextHeadPosition + carToMove.type - 1;
            
            // 打印移动信息
            console.log(`相关车辆向下移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                const moveDistance = carToMove.headMap - oldHead;
                this.playCarMoveAnimation(carToMove.node, new Vec3(0, -CONSTANTS.CAR_POSITION_OFFSET * moveDistance, 0), 'none');
            }
            
            // 更新下一个车的位置，下一辆车的车头=当前车的车尾+1，即当前车车尾的下面一格
            nextHeadPosition = carToMove.tailMap + 1;
        }
    }

    /**
     * 移动相同Rx中sort比当前车大的车一起向右移动（但sort+1的车是不进入停车场的）
     */
    private moveRxSimilarCarsWithHigherSortRight(outerMap: string, currentSort: number, map: number[][], mapW: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同outerMap且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        const y = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        
        // 移动这些车（尽量向右移动但不进入停车场）
        for (const carToMove of carsToMove) {
            const oldHead = carToMove.headMap;
            
            // 尽量向右移动：从当前车头+1开始向右遍历，找到最远的可移动位置
            let newHeadPos = carToMove.headMap;
            for (let index = carToMove.headMap + 1; index < mapW; index++) {
                // 检查这个位置及后续位置是否都可用
                let canMove = true;
                for (let checkPos = index; checkPos > index - carToMove.type; checkPos--) {
                    if (this.isValidMapPosition(map, y, checkPos) && map[y][checkPos] !== 0) {
                        canMove = false;
                        break;
                    }
                }
                
                if (canMove) {
                    newHeadPos = index;
                } else {
                    break;
                }
            }
            
            // 如果没有找到更好的位置，至少确保不进入停车场，要≤-1
            newHeadPos = Math.min(-1, newHeadPos);
            
            // 清除原位置
            for (let i = carToMove.headMap; i >= carToMove.tailMap; i--) {
                if (this.isValidMapPosition(map, y, i)) {
                    map[y][i] = 0;
                }
            }
            
            // 更新停放信息，找到车头，Rx的车尾总是=车头-长度+1。
            carToMove.headMap = newHeadPos;
            carToMove.tailMap = newHeadPos - carToMove.type + 1;
            console.log('移动相同Rx中sort比当前车大的车一起向右移动（但sort+1的车是不进入停车场的）');
            // 设置新位置
            for (let i = carToMove.headMap; i >= carToMove.tailMap; i--) {
                if (this.isValidMapPosition(map, y, i)) {
                    map[y][i] = carToMove.sort;
                }
            }
            
            // 打印移动信息
            console.log(`相关车辆尽量向右移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                this.playCarMoveAnimation(carToMove.node, new Vec3(-CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0, 0), 'none');
            }
        }
    }

    /**
     * Rx汽车向左连带移动
     */
    private moveRxSimilarCarsWithHigherSortLeft(outerMap: string, currentSort: number, map: number[][], currentCarTailMap: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同Rx且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        // 按sort排序，确保按顺序移动
        carsToMove.sort((a, b) => a.sort - b.sort);
        
        // 移动这些车，确保与当前车相邻，下一辆车的车头=当前车的车尾-1，即当前车车尾的左面一格
        let nextHeadPosition = currentCarTailMap - 1;
        
        for (const carToMove of carsToMove) {
            const oldHead = carToMove.headMap;
            const y = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
            
            // 从地图上清除原位置，注意Rx是递减
            for (let i = carToMove.headMap; i >= carToMove.tailMap; i--) {
                if (this.isValidMapPosition(map, y, i)) {
                    map[y][i] = 0;
                }
            }
            
            // 更新停放信息，确保与当前车相邻，Rx下一辆车的车头=当前车的车尾-1，即当前车车尾的左面一格
            // Rx的车尾总是=车头-长度+1
            carToMove.headMap = nextHeadPosition;
            carToMove.tailMap = nextHeadPosition - carToMove.type + 1;
            
            // 打印移动信息
            console.log(`相关车辆向左移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                const moveDistance = carToMove.headMap - oldHead;
                this.playCarMoveAnimation(carToMove.node, new Vec3(CONSTANTS.CAR_POSITION_OFFSET * moveDistance, 0, 0), 'none');
            }
            
            // 更新下一个车的位置，Rx下一辆车的车头=当前车的车尾-1，即当前车车尾的左面一格
            nextHeadPosition = carToMove.tailMap - 1;
        }
    }

    /**
     * Lx汽车向左连带移动
     */
    private moveLxSimilarCarsWithHigherSortLeft(outerMap: string, currentSort: number, map: number[][], mapW: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同outerMap且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        const y = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        
        // 移动这些车（尽量向上移动但不进入停车场）
        for (const carToMove of carsToMove) {
            const oldHead = carToMove.headMap;
            
            // 尽量向左移动：从当前车头-1开始向左遍历，找到最远的可移动位置
            let newHeadPos = carToMove.headMap;
            for (let index = carToMove.headMap - 1; index >= mapW; index--) {
                // 检查这个位置及后续位置是否都可用
                let canMove = true;
                for (let checkPos = index; checkPos < index + carToMove.type; checkPos++) {
                    if (this.isValidMapPosition(map, y, checkPos) && map[y][checkPos] !== 0) {
                        canMove = false;
                        break;
                    }
                }
                
                if (canMove) {
                    newHeadPos = index;
                } else {
                    break;
                }
            }
            
            // 如果没有找到更好的位置，至少确保不进入停车场
            newHeadPos = Math.max(mapW, newHeadPos);
            
            // 清除原位置
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, y, i)) {
                    map[y][i] = 0;
                }
            }
            
            // 更新停放信息，找到车头，Lx的车尾总是=车头+长度-1。
            carToMove.headMap = newHeadPos;
            carToMove.tailMap = newHeadPos + carToMove.type - 1;
            
            // 设置新位置
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, y, i)) {
                    map[y][i] = carToMove.sort;
                }
            }
            
            // 打印移动信息
            console.log(`相关车辆尽量向上移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                this.playCarMoveAnimation(carToMove.node, new Vec3(CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0, 0), 'none');
            }
        }
    }

    /**
     * Lx汽车向右连带移动
     */
    private moveLxSimilarCarsWithHigherSortRight(outerMap: string, currentSort: number, map: number[][], currentCarTailMap: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同Lx且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        // 按sort排序，确保按顺序移动
        carsToMove.sort((a, b) => a.sort - b.sort);
        
        // 移动这些车，确保与当前车相邻，下一辆车的车头=当前车的车尾+1，即当前车车尾的下面一格
        let nextHeadPosition = currentCarTailMap + 1;
        
        for (const carToMove of carsToMove) {
            const oldHead = carToMove.headMap;
            const y = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
            
            // 从地图上清除原位置
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, y, i)) {
                    map[y][i] = 0;
                }
            }
            
            // 更新停放信息，确保与当前车相邻，下一辆车的车头=当前车的车尾+1，即当前车车尾的下面一格
            // Lx的车尾总是=车头+长度-1
            carToMove.headMap = nextHeadPosition;
            carToMove.tailMap = nextHeadPosition + carToMove.type - 1;
            
            // 打印移动信息
            console.log(`相关车辆向左移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                const moveDistance = carToMove.headMap - oldHead;
                this.playCarMoveAnimation(carToMove.node, new Vec3(-CONSTANTS.CAR_POSITION_OFFSET * moveDistance, 0, 0), 'none');
            }
            
            // 更新下一个车的位置，下一辆车的车头=当前车的车尾+1，即当前车车尾的下面一格
            nextHeadPosition = carToMove.tailMap + 1;
        }
    }

    /**
     * 获取汽车所在行的位置
     */
    /**
     * 获取汽车的列位置（用于Ux汽车）
     */
    private getCarColumnPosition(outerMap: string): number {
        // 从outerMap中提取列号，例如 "U0" -> 0, "U1" -> 1
        const match = outerMap.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    /**
     * 获取汽车的行位置（用于Rx和Lx汽车）
     */
    private getCarRowPosition(outerMap: string): number {
        // 从outerMap中提取行号，例如 "R0" -> 0, "R1" -> 1
        const match = outerMap.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    /**
     * 更新地图数据（支持Ux、Rx、Lx汽车）
     */
    private updateMapForCarMovement(
        map: number[][], 
        newHead: number, 
        newTail: number, 
        oldHead: number, 
        oldTail: number, 
        coordinate: number, 
        carType: number,
        isHorizontal: boolean = false
    ): void {
        if (isHorizontal) {
            // Rx和Lx汽车：水平移动，coordinate是行号(y)
            // 清除旧位置
            const oldStart = Math.min(oldHead, oldTail);
            const oldEnd = Math.max(oldHead, oldTail);
            for (let i = oldStart; i <= oldEnd; i++) {
                if (this.isValidMapPosition(map, coordinate, i)) {
                    map[coordinate][i] = 0;
                }
            }
            
            // 设置新位置
            const newStart = Math.min(newHead, newTail);
            const newEnd = Math.max(newHead, newTail);
            for (let i = newStart; i <= newEnd; i++) {
                if (this.isValidMapPosition(map, coordinate, i)) {
                    map[coordinate][i] = carType;
                }
            }
        } else {
            // Ux汽车：垂直移动，coordinate是列号(x)
            // 清除旧位置
            for (let i = oldHead; i <= oldTail; i++) {
                if (this.isValidMapPosition(map, i, coordinate)) {
                    map[i][coordinate] = 0;
                }
            }
            
            // 设置新位置
            for (let i = newHead; i <= newTail; i++) {
                if (this.isValidMapPosition(map, i, coordinate)) {
                    map[i][coordinate] = carType;
                }
            }
        }
    }

    /**
     * 播放汽车移动动画
     */
    private playCarMoveAnimation(carNode: Node, targetOffset: Vec3, parkingStatusChange?: 'enter' | 'exit' | 'none'): void {
        this.isAnimationPlaying = true;
        this.moveCarAnimation(carNode, targetOffset, this.carAnimDuration, () => {
            this.isAnimationPlaying = false;
            // 动画播放完毕后根据停车状态更新计数
            this.updateParkingCount(parkingStatusChange);
        });
    }

    /**
     * 汽车移动动画
     */
    private moveCarAnimation(carNode: Node, targetOffset: Vec3, duration: number, callback?: () => void): void {
        const startPosition = carNode.position.clone();
        const targetPosition = startPosition.add(targetOffset);
        
        tween(carNode)
            .to(duration, { position: targetPosition })
            .call(() => {
                if (callback) {
                    callback();
                }
            })
            .start();
    }

    /**
     * 根据停车状态更新计数
     */
    private updateParkingCount(parkingStatusChange?: 'enter' | 'exit' | 'none'): void {
        console.log(`updateParkingCount被调用，参数: ${parkingStatusChange}`);
        console.log(`当前成功停车数: ${this.successfulParks}`);
        
        if (parkingStatusChange === 'enter') {
            this.successfulParks++;
            console.log(`汽车进入停车场，成功停车计数增加到: ${this.successfulParks}`);
        } else if (parkingStatusChange === 'exit') {
            this.successfulParks = Math.max(0, this.successfulParks - 1);
            console.log(`汽车撤出停车场，成功停车计数减少到: ${this.successfulParks}`);
        } else {
            console.log(`停车状态无变化(${parkingStatusChange})，成功停车数保持: ${this.successfulParks}`);
        }
        
        // 检查是否通关
        this.checkLevelComplete();
    }

    /**
     * 检查是否通关
     */
    private checkLevelComplete(): void {
        const totalCars = this.carParkingInfos.length;
        console.log(`当前成功停车数: ${this.successfulParks}, 本关汽车总数: ${totalCars}`);
        
        if (this.successfulParks === totalCars && totalCars > 0) {
            console.log('===== 通关条件达成！所有汽车都已成功停车 =====');
            if (this.uiManager) {
                this.uiManager.showLevelClearOnly();
            } else {
                console.error('UIManager引用未设置，无法显示通关界面');
            }
        }
    }

    /**
     * 增加成功停车计数（保留原方法供外部调用）
     */
    public incrementSuccessfulPark(): void {
        this.successfulParks++;
        console.log(`成功停车计数增加到: ${this.successfulParks}`);
        // 检查是否通关
        this.checkLevelComplete();
    }

    /**
     * 获取成功停车计数
     */
    public getSuccessfulParks(): number {
        return this.successfulParks;
    }

    /**
     * 设置当前关卡
     */
    public setCurrentLevel(level: number): void {
        if (level < 1) {
            console.warn(`Invalid level: ${level}. Level must be >= 1`);
            return;
        }
        this.currentLevel = level;
    }

    /**
     * 获取当前关卡
     */
    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    /**
     * 根据outerMap和sort获取汽车停放信息
     */
    public getCarParkingInfo(outerMap: string, sort: number): CarParkingInfo | null {
        return this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort) || null;
    }

    /**
     * 获取所有汽车停放信息
     */
    public getAllCarParkingInfos(): CarParkingInfo[] {
        return [...this.carParkingInfos]; // 返回副本以防止外部修改
    }

    /**
     * 重置成功停车计数
     */
    public resetSuccessfulParks(): void {
        this.successfulParks = 0;
    }

    /**
     * 检查是否有动画正在播放
     */
    public isAnimating(): boolean {
        return this.isAnimationPlaying;
    }

    /**
     * 获取指定节点的位置策略
     */
    public getPositionStrategy(nodeName: string): CarPositionStrategy | null {
        return this.positionStrategies.get(nodeName) || null;
    }

    /**
     * 重置所有位置策略
     */
    private resetAllStrategies(): void {
        this.positionStrategies.forEach(strategy => {
            strategy.reset();
        });
    }
}