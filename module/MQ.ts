import { MemQueue } from "./QUEUE";

class MQ {
    messageQueueMap: Map<string, MemQueue>
    backendMap: Map<string, string>
    counter: number

    static marshal(obj: Object): MQ {
        let mq = new MQ()
        mq.messageQueueMap = new Map<string, MemQueue>()
        mq.backendMap = new Map<string, string>()
        if (obj) {
            for (let s in obj['messageQueueMap']) {
                let queue = MemQueue.marshal(obj['messageQueueMap'][s]['messageQueue'])
                mq.messageQueueMap.set(obj['messageQueueMap'][s]['consumerName'], queue)
            }
            mq.backendMap = new Map<string, string>(obj['backendMap'])
        }
        mq.counter = 0
        return mq
    }
    static unmarshal(mq: MQ): Object {
        let obj = {
            messageQueueMap: [],
            backendMap: {}
        }
        mq.messageQueueMap.forEach((messageQueue, consumerName) => {
            obj.messageQueueMap.push({
                consumerName: consumerName,
                messageQueue: MemQueue.unmarshal(messageQueue)
            })
        });
        obj.backendMap = mq.backendMap
        return obj
    }

    constructor() {
        this.messageQueueMap = new Map<string, MemQueue>()
        this.backendMap = new Map<string, string>()
        this.counter = 0
    }

    _getNewId(): string {
        let id: string = Game.time + ':' + this.counter
        this.counter++
        return id
    }

    //返回id
    sendRequest(consumerName: string, producerName: string, body: string): string {
        let id = this._getNewId()
        let queue = this.messageQueueMap.get(consumerName)
        if (!queue) {
            let queue = new MemQueue()
            this.messageQueueMap.set(consumerName, queue)
        }
        queue.addLast(producerName + ';' + id + ';' + body)
        return id
    }
    //返回id
    sendRequestUrgently(consumerName: string, producerName: string, body: string): string {
        let id = this._getNewId()
        let queue = this.messageQueueMap.get(consumerName)
        if (!queue) {
            let queue = new MemQueue()
            this.messageQueueMap.set(consumerName, queue)
        }
        queue.addFirst(producerName + ';' + id + ';' + body)
        return id
    }
    //返回producerName;id;body,消费
    getRequest(consumerName: string): string {
        let queue = this.messageQueueMap.get(consumerName)
        if (!queue) return undefined
        return queue.removeFirst()
    }
    sendResponse(id: string, body: string) {
        this.backendMap.set(id,body)
    }
    getResponses(id: string): string {
        let response = this.backendMap.get(id)
        this.backendMap.delete(id)
        return response
    }
}