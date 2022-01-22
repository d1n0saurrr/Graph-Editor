class ReductionAlgoSolver {
    constructor(powVector) {
        powVector.sort(function (a, b) {
            return b - a;
        });
        this.powVector = [...powVector];
        let matrix = Array(powVector.length).fill(null).map(() => Array(powVector.length).fill(0));
        let vect = [];
        for (let i = 0; i < powVector.length; i++) {
            vect.push({id: i, pow: powVector[i]});
        }
        if (powVector.reduce((partial_sum, a) => partial_sum + a, 0) % 2 !== 0) return undefined;
        let count = 0;
        this.answer = [];
        this.answer.push([...powVector]);
        //console.log(powVector)
        while (powVector[0] !== 0) {
            let a = powVector[0];
            if(a > powVector.length - 1 - count) return undefined;
            let id = vect[0].id
            powVector.splice(0, 1);
            vect.splice(0, 1);
            for (let i = 0; i < a; i++) {
                vect[i].pow--;
                powVector[i]--;
                matrix[id][vect[i].id] = 1;
                matrix[vect[i].id][id] = 1;
                if (powVector[i] === 0) count++;
            }
            powVector.sort(function (a, b) {
                return b - a;
            });
            vect.sort(function (a, b) {
                return b.pow - a.pow;
            });
            this.answer.push([...powVector]);
            //console.log(powVector);
            //console.log(vect);
        }
        //console.log(this.answer);
       this.graph = new ExtremeGraph(undefined, matrix);
    }
}