var BulletType = {
    STRAIGHT: 1,
    SIN: 2,
    DIAG: 3,
    ROT: 4,
    BALL: 5
};
var Stages=[];
Stages[0] = {
    speed: { 
        x: 3,
        y: 0
    },
    //[ŧime(s)],[height],[type]
    content: [
        [1, 100, BulletType.STRAIGHT],
        [1, 300, BulletType.STRAIGHT],
        [1, 500, BulletType.STRAIGHT],
        [2, 250, BulletType.SIN],
        [2, 450, BulletType.SIN],
        [3, 300, BulletType.SIN],
        [5, 250, BulletType.STRAIGHT],
        [5.2, 250, BulletType.STRAIGHT],
        [5.4, 250, BulletType.STRAIGHT],
        [5.6, 250, BulletType.STRAIGHT],
        [6, 250, BulletType.BALL]
    ]
};

