class ExtrimGraphsSolver {
    constructor(base1, base2) {
        this.firstGraph = new ExtremeGraph(base1, undefined);
        this.secGraph = new ExtremeGraph(base2, undefined);
        this.firstAdditional = new ExtremeGraph(undefined, this.firstGraph.findAddition());
        this.secAdditional = new ExtremeGraph(undefined, this.secGraph.findAddition());
        this.union = new ExtremeGraph(undefined, this.firstGraph.getUnificationMatrix(this.secGraph));
        this.intersection = new ExtremeGraph(undefined, this.firstGraph.getIntersectionMatrix(this.secGraph));
        let matrix = this.firstGraph.getReduceMatrix(this.secGraph);
        if (matrix !== undefined) {
            this.firstReduce = new ExtremeGraph(undefined, matrix);
        }

        matrix = this.secGraph.getReduceMatrix(this.firstGraph);
        if (matrix !== undefined) {
            this.secReduce = new ExtremeGraph(undefined, matrix);
        }

    }
}

class ExtremeGraph {
    constructor(base, matrix) {
        if (matrix === undefined) {
            this.base = [...base];
            this.matrix = Array(base[0].second).fill(null).map(() => Array(base[0].second).fill(0));
            let curI = 0;
            let prev = this.matrix.length;
            for (const elem of base) {
                if (elem.second > prev || elem.first > this.matrix.length) {
                    console.log("Ошибка, неверная база");
                    return undefined;
                } else {
                    while (curI <= elem.first - 1) {
                        for (let i = 0; i < elem.second; i++) {
                            if (curI !== i) {
                                this.matrix[curI][i] = 1
                                this.matrix[i][curI] = 1;
                            }
                        }
                        curI++;
                    }
                    prev = elem.second
                }
            }
            this.findVertsPow();
            this.findEdges();
            this.additionGraph = new ExtremeGraph(undefined, this.findAddition());
            this.isExtreme = this.checkExtreme();

        } else if (base === undefined) {
            this.matrix = [...matrix];
            this.isExtreme = this.checkExtreme();
            this.findVertsPow();
            this.findEdges();
            if (this.isExtreme) {
                this.findBase();
            }


        }
        console.log('///////////////');
        console.log(this.base);
        console.log(this.matrix);
        console.log(this.vertsPowVector);
        console.log(this.edgesList);
        console.log(this.isExtreme);
        console.log('///////////////');
    }

    getReduceMatrix(graph) {
        let matrix1 = [];
        let matrix2 = [];
        if (this.matrix.length >= graph.matrix.length) {
            matrix1 = [...this.matrix];
            matrix2 = this.exposeMatrix(graph.matrix, this.matrix.length);
        } else return undefined;
        let res = Array(matrix1.length).fill(null).map(() => Array(matrix1.length).fill(0));
        for (let i = 0; i < res.length; i++) {
            for (let j = 0; j < res.length; j++) {
                if (matrix1[i][j] === 1 && matrix2[i][j] === 1) res[i][j] = 0;
            }
        }
        return res
    }

    getIntersectionMatrix(graph) {
        let matrix1 = [];
        let matrix2 = [];

        if (this.matrix.length > graph.matrix.length) {
            matrix1 = [...this.matrix];
            matrix2 = this.exposeMatrix(graph.matrix, this.matrix.length);
        } else {
            matrix1 = [...graph.matrix];
            matrix2 = this.exposeMatrix(this.matrix, graph.matrix.length);
        }
        let res = Array(matrix1.length).fill(null).map(() => Array(matrix1.length).fill(0));
        for (let i = 0; i < res.length; i++) {
            for (let j = 0; j < res.length; j++) {
                if (matrix1[i][j] === 1 && matrix2[i][j] === 1) res[i][j] = 1;
            }
        }
        return res
    }

    getUnificationMatrix(graph) {
        let matrix1 = [];
        let matrix2 = [];

        if (this.matrix.length > graph.matrix.length) {
            matrix1 = [...this.matrix];
            matrix2 = this.exposeMatrix(graph.matrix, this.matrix.length);
        } else {
            matrix1 = [...graph.matrix];
            matrix2 = this.exposeMatrix(this.matrix, graph.matrix.length);
        }
        let res = Array(matrix1.length).fill(null).map(() => Array(matrix1.length).fill(0));
        for (let i = 0; i < res.length; i++) {
            for (let j = 0; j < res.length; j++) {
                if (matrix1[i][j] === 1 || matrix2[i][j] === 1) res[i][j] = 1;
            }
        }
        return res;
    }

    exposeMatrix(matrix, newSize) {
        let res = Array(newSize).fill(null).map(() => Array(newSize).fill(0));
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix.length; j++) {
                res[i][j] = matrix[i][j];
            }
        }
        return res;
    }

    findVertsPow() {
        this.vertsPowVector = [];
        for (const row of this.matrix) {
            this.vertsPowVector.push(row.reduce((partial_sum, a) => partial_sum + a, 0));
        }
    }

    findEdges() {
        this.edgesList = [];
        for (let i = 0; i < this.matrix.length; i++) {
            for (let j = i; j < this.matrix.length; j++) {
                if (this.matrix[i][j] === 1) this.edgesList.push({from: i + 1, to: j + 1})
            }
        }
    }

    findAddition() {
        let additionMatrix = Array(this.matrix.length).fill(null).map(() => Array(this.matrix.length).fill(0));
        for (let i = 0; i < this.matrix.length; i++) {
            for (let j = 0; j < this.matrix.length; j++) {
                if (i !== j) additionMatrix[i][j] = 1 - this.matrix[i][j];
            }
        }
        return additionMatrix;
    }

    findBase() {
        this.base = [];
        let prev = this.vertsPowVector[0];
        for (let i = 0; i < (this.vertsPowVector.length + 2 - 1) / 2;) {
            i = this.vertsPowVector.lastIndexOf(prev);
            if (i < (this.vertsPowVector.length + 2 - 1) / 2) {
                this.base.push({first: i + 1, second: prev + 1});
            } else {
                this.base.push({first: (this.vertsPowVector.length + 2 - 1) / 2, second: prev + 1});
            }
            prev = this.vertsPowVector[i + 1];
        }
    }


    checkExtreme() {

        let isZero = false;
        for (let i = 0; i < this.matrix.length; i++) {
            isZero = false;
            for (let j = 0; j < this.matrix.length; j++) {
                if (this.matrix[i][j] !== this.matrix[j][i]) return false;
                if (i !== j && this.matrix[i][j] === 0) isZero = true;
                if (isZero && this.matrix[i][j] === 1) return false;
            }
        }
        return true
    }


}