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
}

// 汽车移动状态枚举
enum CarMovementStatus {
    CAN_MOVE_UP,
    CAN_MOVE_DOWN,
    CANNOT_MOVE,
    CAN_MOVE_DOWN_IN_PARK,
    CAN_MOVE_DOWN_OUT_PARK,
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
    DEFAULT_ANIM_DURATION: 0.5,
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
    private createCars(carData: Array<{outerMap: string, sort: number, type: number}>): void {
        for (const car of carData) {
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
    private createCar(car: {outerMap: string, sort: number, type: number}): void {
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
        
        const parkingInfo = this.calculateParkingInfo(outerMap, sort, type, carNode);
        this.carParkingInfos.push(parkingInfo);
        this.setupCarClickEvents(carNode, parentNode, type, sort);
    }

    /**
     * 验证汽车数据
     */
    private validateCarData(car: {outerMap: string, sort: number, type: number}): boolean {
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
    private calculateParkingInfo(outerMap: string, sort: number, type: number, carNode: Node): CarParkingInfo {
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        if (!mapData) {
            throw new Error(`Cannot get map data for level ${this.currentLevel}`);
        }

        let headMap = 0;
        let tailMap = 0;

        // 根据方向计算初始位置
        if (outerMap.startsWith(CarDirection.UP)) {
            headMap = mapData.MapH;
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith(CarDirection.LEFT)) {
            headMap = mapData.MapW;
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith(CarDirection.RIGHT)) {
            headMap = -1;
            tailMap = headMap - type + 1;
        }

        // 考虑sort位置
        if (sort > 0) {
            const prevInfo = this.carParkingInfos.find(info => 
                info.outerMap === outerMap && info.sort === sort - 1
            );
            
            if (prevInfo) {
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
            node: carNode
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
     * 处理汽车点击逻辑
     */
    private handleCarClick(carNode: Node, parentNode: Node, type: number, sort: number): void {
        if (this.isAnimationPlaying) {
            return;
        }

        const outerMap = parentNode.name.replace('node', '');
        const parkingInfo = this.findCarParkingInfo(outerMap, sort, type);
        
        if (!parkingInfo) {
            console.warn(`Car parking info not found for ${outerMap}, sort: ${sort}, type: ${type}`);
            return;
        }

        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        if (!mapData) {
            console.error(`Map data not found for level ${this.currentLevel}`);
            return;
        }

        const movementStatus = this.calculateMovementStatus(parkingInfo, mapData, outerMap);
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
    private calculateMovementStatus(parkingInfo: CarParkingInfo, mapData: any, outerMap: string): CarMovementStatus {
        if (outerMap.startsWith(CarDirection.UP)) {
            return this.calculateUpCarMovementStatus(parkingInfo, mapData, outerMap);
        } else if (outerMap.startsWith(CarDirection.LEFT)) {
            return this.calculateLeftCarMovementStatus(parkingInfo, mapData, outerMap);
        } else if (outerMap.startsWith(CarDirection.RIGHT)) {
            return this.calculateRightCarMovementStatus(parkingInfo, mapData, outerMap);
        }
        return CarMovementStatus.CANNOT_MOVE;
    }

    /**
     * 计算上方向汽车移动状态
     */
    private calculateUpCarMovementStatus(parkingInfo: CarParkingInfo, mapData: any, outerMap: string): CarMovementStatus {
        const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        const map = mapData.Map;
        const mapH = mapData.MapH;

        console.log("汽车属于下方");

        const canMoveUp = this.canCarMoveUp(parkingInfo, map, x);
        
        // 使用canCarMoveUp方法的结果来判断是否可以向上开
        if (!canMoveUp) {
            console.log("汽车不可以向上开");
            
            // 检查是否可以向下开
            const tailBelowRow = parkingInfo.tailMap + 1;
            const headAlreadyOutside = parkingInfo.headMap < 0;
            const carAlreadyOutside = parkingInfo.headMap >= mapH; // 汽车已经在停车场外
            
            // 车尾下面一格是停车场内 并且 车尾下面一格不是0
            const tailBelowBlocked = (tailBelowRow < mapH && map[tailBelowRow][x] !== 0);
            
            if (tailBelowBlocked || headAlreadyOutside || carAlreadyOutside) {
                console.log("汽车也不可以向下开");
                return CarMovementStatus.CANNOT_MOVE;
            } else {
                console.log("汽车可以向下开");
                
                // 检查汽车会停在哪里
                let carStopsOutside = true;
                for (let index = parkingInfo.tailMap + 1; index < mapH; index++) {
                    if (map[index][x] !== 0) {
                        console.log(`车尾会停在${index - 1}`, "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
                        carStopsOutside = false;
                        break;
                    }
                }
                
                if (carStopsOutside) {
                    console.log("Ux的汽车会停在停车场外，和Ux相同且Sort比它大的车一起撤出停车场。");
                    return CarMovementStatus.CAN_MOVE_DOWN_OUT_PARK;
                } else {
                    return CarMovementStatus.CAN_MOVE_DOWN_IN_PARK;
                }
            }
        } else {
            console.log("汽车可以向上开");
            
            // 寻找车头新位置
            let newHeadPos = parkingInfo.headMap - 1;
            for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
                if (map[index][x] !== 0) {
                    break;
                }
                newHeadPos = index;
            }
            
            console.log(`车头会停在${newHeadPos}`);
            return CarMovementStatus.CAN_MOVE_UP;
        }
    }

    /**
     * 计算左方向汽车移动状态
     */
    private calculateLeftCarMovementStatus(parkingInfo: CarParkingInfo, mapData: any, outerMap: string): CarMovementStatus {
        // TODO: 实现左方向汽车移动逻辑
        return CarMovementStatus.CANNOT_MOVE;
    }

    /**
     * 计算右方向汽车移动状态
     */
    private calculateRightCarMovementStatus(parkingInfo: CarParkingInfo, mapData: any, outerMap: string): CarMovementStatus {
        // TODO: 实现右方向汽车移动逻辑
        return CarMovementStatus.CANNOT_MOVE;
    }

    /**
     * 检查汽车是否可以向上移动
     */
    private canCarMoveUp(parkingInfo: CarParkingInfo, map: number[][], x: number): boolean {
        if (parkingInfo.headMap === 0) {
            return false;
        }
        
        const rowIndex = parkingInfo.headMap - 1;
        if (!this.isValidMapPosition(map, rowIndex, x) || map[rowIndex][x] !== 0) {
            return false;
        }
        
        // 检查汽车是否在停车场外且它上方有车
        const mapH = map.length;
        const isCarOutsidePark = parkingInfo.headMap >= mapH;
        if (isCarOutsidePark) {
            // 检查上方是否有车（需要考虑上方位置也可能在停车场外）
            const upperPosition = parkingInfo.headMap - 1;
            if (upperPosition >= 0) {
                // 如果上方位置在停车场内，检查map
                if (upperPosition < mapH && map[upperPosition][x] !== 0) {
                    return false;
                }
                // 如果上方位置也在停车场外，检查是否有其他车辆占据该位置
                if (upperPosition >= mapH) {
                    const hasCarAbove = this.carParkingInfos.some(carInfo => 
                        carInfo.outerMap === parkingInfo.outerMap && 
                        carInfo !== parkingInfo && // 排除自己
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
     * 检查汽车是否可以向下移动
     */
    private canCarMoveDown(parkingInfo: CarParkingInfo, map: number[][], x: number, mapH: number): boolean {
        if (parkingInfo.headMap < 0) {
            return false;
        }
        
        const tailRowIndex = parkingInfo.tailMap + 1;
        return tailRowIndex < mapH && 
               this.isValidMapPosition(map, tailRowIndex, x) && 
               map[tailRowIndex][x] === 0;
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
    private executeCarMovement(
        carNode: Node, 
        parkingInfo: CarParkingInfo, 
        mapData: any, 
        outerMap: string, 
        movementStatus: CarMovementStatus
    ): void {
        if (movementStatus === CarMovementStatus.CANNOT_MOVE) {
            return;
        }

        if (outerMap.startsWith(CarDirection.UP)) {
            this.executeUpCarMovement(carNode, parkingInfo, mapData, outerMap, movementStatus);
        }
        // TODO: 实现其他方向的移动逻辑
    }

    /**
     * 执行上方向汽车移动
     */
    private executeUpCarMovement(
        carNode: Node, 
        parkingInfo: CarParkingInfo, 
        mapData: any, 
        outerMap: string, 
        movementStatus: CarMovementStatus
    ): void {
        const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        const map = mapData.Map;
        const mapH = mapData.MapH;

        if (movementStatus === CarMovementStatus.CAN_MOVE_UP) {
            this.moveCarUp(carNode, parkingInfo, map, x);
        } else if (movementStatus === CarMovementStatus.CAN_MOVE_DOWN_IN_PARK) {
            this.moveCarDown(carNode, parkingInfo, map, x, mapH);
        } else if (movementStatus === CarMovementStatus.CAN_MOVE_DOWN_OUT_PARK) {
            this.moveCarDownOutPark(carNode, parkingInfo, map, x, mapH, outerMap);
        }
    }

    /**
     * 向上移动汽车
     */
    private moveCarUp(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number): void {
        const oldHead = parkingInfo.headMap;
        let newHeadPos = parkingInfo.headMap - 1;
        const mapH = map.length;

        // 寻找新的车头位置
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

        // 更新停放信息
        parkingInfo.headMap = newHeadPos;
        parkingInfo.tailMap = newHeadPos + parkingInfo.type - 1;

        // 打印汽车移动后的位置
        console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);

        // 更新地图数据
        this.updateMapForCarMovement(map, newHeadPos, parkingInfo.tailMap, oldHead, oldHead + parkingInfo.type - 1, x, parkingInfo.type);

        // 判断停车状态变化
        const wasOutsidePark = oldHead >= mapH;
        const isNowInsidePark = parkingInfo.tailMap < mapH;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasOutsidePark && isNowInsidePark) {
            parkingStatusChange = 'enter';
            console.log("汽车从停车场外完全进入停车场内");
        }
        
        // 播放动画
        this.playCarMoveAnimation(carNode, new Vec3(0, CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0), parkingStatusChange);
    }

    /**
     * 向下移动汽车
     */
    private moveCarDown(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number, mapH: number): void {
        let carStopsOutside = true;
        let stopIndex = mapH;

        // 检查车尾+1到mapH-1的位置
        for (let index = parkingInfo.tailMap + 1; index < mapH; index++) {
            if (this.isValidMapPosition(map, index, x) && map[index][x] !== 0) {
                carStopsOutside = false;
                stopIndex = index;
                break;
            }
        }

        const oldHead = parkingInfo.headMap;
        
        if (carStopsOutside) {
            // 汽车停在停车场外
            parkingInfo.headMap = parkingInfo.tailMap + 1;
            parkingInfo.tailMap = mapH - 1;
            
            // 打印汽车移动后的位置
            console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);
            
            // 清除原位置
            for (let i = oldHead; i < oldHead + parkingInfo.type; i++) {
                if (this.isValidMapPosition(map, i, x)) {
                    map[i][x] = 0;
                }
            }
        } else {
            // 汽车停在停车场内
            parkingInfo.headMap = parkingInfo.tailMap + 1;
            parkingInfo.tailMap = stopIndex - 1;
            
            // 打印汽车移动后的位置
            console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);
            
            // 更新地图数据
            this.updateMapForCarMovement(map, parkingInfo.headMap, parkingInfo.tailMap, oldHead, oldHead + parkingInfo.type - 1, x, parkingInfo.type);
        }

        // 移动相同Ux且Sort比它大的车，确保相邻
        this.moveSimilarCarsWithHigherSortDown(parkingInfo.outerMap, parkingInfo.sort, map, mapH, parkingInfo.tailMap);

        
        // 判断停车状态变化 - 向下移动进入停车场
        const wasOutsidePark = oldHead >= mapH;
        const isNowInsidePark = parkingInfo.tailMap < mapH;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasOutsidePark && isNowInsidePark) {
            parkingStatusChange = 'enter';
            console.log("汽车向下移动从停车场外完全进入停车场内");
        }
        
        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.headMap - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(0, moveDistance, 0), parkingStatusChange);
    }

    /**
     * 向下移动汽车到停车场外
     */
    private moveCarDownOutPark(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number, mapH: number, outerMap: string): void {
        const oldHead = parkingInfo.headMap;
        
        // 汽车停在停车场外
        parkingInfo.headMap = mapH;
        parkingInfo.tailMap = mapH + parkingInfo.type - 1;
        
        // 打印汽车移动后的位置
        console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);
        
        // 清除原位置
        for (let i = oldHead; i < oldHead + parkingInfo.type; i++) {
            if (this.isValidMapPosition(map, i, x)) {
                map[i][x] = 0;
            }
        }
        
        // 移动相同Ux且Sort比它大的车，确保相邻
        this.moveSimilarCarsWithHigherSortDown(outerMap, parkingInfo.sort, map, mapH, parkingInfo.tailMap);
        
        // 判断停车状态变化 - 撤出停车场
        const wasInsidePark = oldHead < mapH;
        const isNowOutsidePark = parkingInfo.headMap >= mapH;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasInsidePark && isNowOutsidePark) {
            parkingStatusChange = 'exit';
            console.log("汽车撤出停车场");
        }
        
        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.headMap - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(0, moveDistance, 0), parkingStatusChange);
    }

    /**
     * 移动相同Ux中sort比当前车大的车一起向上移动（但不进入停车场）
     */
    private moveSimilarCarsWithHigherSortUp(outerMap: string, currentSort: number, map: number[][], mapH: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同outerMap且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        // 移动这些车（向上移动但不进入停车场）
        for (const carToMove of carsToMove) {
            const oldHead = carToMove.headMap;
            
            // 计算新的位置（向上移动一个单位，但确保不进入停车场）
            let newHeadPos = Math.max(mapH, carToMove.headMap - 1);
            
            // 更新停放信息
            carToMove.headMap = newHeadPos;
            carToMove.tailMap = newHeadPos + carToMove.type - 1;
            
            // 打印移动信息
            console.log(`相关车辆向上移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                this.playCarMoveAnimation(carToMove.node, new Vec3(0, CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0), 'none');
            }
        }
    }

    private moveSimilarCarsWithHigherSortDown(outerMap: string, currentSort: number, map: number[][], mapH: number, currentCarTailMap: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同outerMap且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        // 按sort排序，确保按顺序移动
        carsToMove.sort((a, b) => a.sort - b.sort);
        
        // 移动这些车，确保与当前车相邻
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
            
            // 更新停放信息，确保相邻
            carToMove.headMap = nextHeadPosition;
            carToMove.tailMap = nextHeadPosition + carToMove.type - 1;
            
            // 打印移动信息
            console.log(`相关车辆向下移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                const moveDistance = carToMove.headMap - oldHead;
                this.playCarMoveAnimation(carToMove.node, new Vec3(0, -CONSTANTS.CAR_POSITION_OFFSET * moveDistance, 0), 'none');
            }
            
            // 更新下一个车的位置
            nextHeadPosition = carToMove.tailMap + 1;
        }
    }

    /**
     * 更新地图数据
     */
    private updateMapForCarMovement(
        map: number[][], 
        newHead: number, 
        newTail: number, 
        oldHead: number, 
        oldTail: number, 
        x: number, 
        carType: number
    ): void {
        // 清除旧位置
        for (let i = oldHead; i <= oldTail; i++) {
            if (this.isValidMapPosition(map, i, x)) {
                map[i][x] = 0;
            }
        }
        
        // 设置新位置
        for (let i = newHead; i <= newTail; i++) {
            if (this.isValidMapPosition(map, i, x)) {
                map[i][x] = carType;
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
        if (parkingStatusChange === 'enter') {
            this.successfulParks++;
            console.log(`汽车进入停车场，成功停车计数增加到: ${this.successfulParks}`);
        } else if (parkingStatusChange === 'exit') {
            this.successfulParks = Math.max(0, this.successfulParks - 1);
            console.log(`汽车撤出停车场，成功停车计数减少到: ${this.successfulParks}`);
        }
        // parkingStatusChange === 'none' 时不更新计数
        
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
            if (strategy.reset) {
                strategy.reset();
            }
        });
    }
}