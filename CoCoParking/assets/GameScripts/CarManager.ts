import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween } from 'cc';
import { MapData } from './MapData';
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

        const canMoveUp = this.canCarMoveUp(parkingInfo, map, x);
        const canMoveDown = this.canCarMoveDown(parkingInfo, map, x, mapH);

        if (!canMoveUp && !canMoveDown) {
            return CarMovementStatus.CANNOT_MOVE;
        } else if (!canMoveUp) {
            return CarMovementStatus.CAN_MOVE_DOWN;
        } else {
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
        return this.isValidMapPosition(map, rowIndex, x) && map[rowIndex][x] === 0;
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
        } else if (movementStatus === CarMovementStatus.CAN_MOVE_DOWN) {
            this.moveCarDown(carNode, parkingInfo, map, x, mapH);
        }
    }

    /**
     * 向上移动汽车
     */
    private moveCarUp(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number): void {
        const oldHead = parkingInfo.headMap;
        let newHeadPos = parkingInfo.headMap - 1;

        // 寻找新的车头位置
        for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
            if (this.isValidMapPosition(map, index, x) && map[index][x] !== 0) {
                break;
            }
            newHeadPos = index;
        }

        // 更新停放信息
        parkingInfo.headMap = newHeadPos;
        parkingInfo.tailMap = newHeadPos + parkingInfo.type - 1;

        // 更新地图数据
        this.updateMapForCarMovement(map, newHeadPos, parkingInfo.tailMap, oldHead, oldHead + parkingInfo.type - 1, x, parkingInfo.type);

        // 播放动画
        this.playCarMoveAnimation(carNode, new Vec3(0, CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0));
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
            
            // 更新地图数据
            this.updateMapForCarMovement(map, parkingInfo.headMap, parkingInfo.tailMap, oldHead, oldHead + parkingInfo.type - 1, x, parkingInfo.type);
        }

        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.headMap - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(0, moveDistance, 0));
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
    private playCarMoveAnimation(carNode: Node, targetOffset: Vec3): void {
        this.isAnimationPlaying = true;
        this.moveCarAnimation(carNode, targetOffset, this.carAnimDuration, () => {
            this.isAnimationPlaying = false;
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
     * 增加成功停车计数
     */
    public incrementSuccessfulPark(): void {
        this.successfulParks++;
        console.log(`成功停车计数增加到: ${this.successfulParks}`);
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