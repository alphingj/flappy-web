import React, { useRef, useEffect } from 'react';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import { View, StyleSheet, Dimensions, Image, Platform, Pressable } from 'react-native';

const BIRD_SIZE_BASE = 50;
const PIPE_WIDTH_BASE = 100;
const GAP_SIZE_BASE = 200;

// --- ENTITIES ---
const Bird = ({ body, imageUri }: { body: Matter.Body, imageUri: string }) => {
    const { x, y } = body.position;
    const angle = body.angle;
    const size = body.circleRadius! * 2;
    return (
        <Image
            source={{ uri: imageUri }}
            style={[
                styles.bird,
                {
                    left: x - size / 2,
                    top: y - size / 2,
                    width: size,
                    height: size,
                    transform: [{ rotate: `${angle}rad` }],
                },
            ]}
        />
    );
};

const Wall = ({ body }: { body: Matter.Body }) => {
    const { x, y } = body.position;
    const wallWidth = body.bounds.max.x - body.bounds.min.x;
    const wallHeight = body.bounds.max.y - body.bounds.min.y;
    return (
        <View
            style={[
                styles.wall,
                {
                    left: x - wallWidth / 2,
                    top: y - wallHeight / 2,
                    width: wallWidth,
                    height: wallHeight,
                },
            ]}
        />
    );
};

// --- SYSTEMS ---
const Physics = (entities: any, { time }: any) => {
    const engine = entities.physics.engine;
    Matter.Engine.update(engine, time.delta);
    return entities;
};

const Jump = (entities: any, { touches, dispatch }: any) => {
    if (touches.find((t: any) => t.type === 'start')) {
        Matter.Body.setVelocity(entities.Bird.body, { x: 0, y: -entities.physics.jumpHeight });
        dispatch({ type: 'jump' });
    }
    return entities;
};

const PipeMovement = (entities: any, { time, dispatch }: any) => {
    const { width, height, gapSize } = entities.physics.dimensions;

    for (let i = 1; i <= 2; i++) {
        const pipeTop = entities[`Pipe${i}Top`];
        const pipeBottom = entities[`Pipe${i}Bottom`];

        Matter.Body.translate(pipeTop.body, { x: -entities.physics.speed, y: 0 });
        Matter.Body.translate(pipeBottom.body, { x: -entities.physics.speed, y: 0 });

        if (pipeTop.body.bounds.max.x < entities.Bird.body.bounds.min.x && !pipeTop.scored) {
            pipeTop.scored = true;
            pipeBottom.scored = true;
            entities.score++;
            dispatch({ type: 'score', score: entities.score });
        }

        if (pipeTop.body.bounds.max.x <= 0) {
            pipeTop.scored = false;
            pipeBottom.scored = false;

            const pipeTopY = Math.random() * (height - gapSize - 200) + 100;
            const pipeBottomY = pipeTopY + gapSize + height / 2;
            Matter.Body.setPosition(pipeTop.body, { x: width, y: pipeTopY - height / 2 });
            Matter.Body.setPosition(pipeBottom.body, { x: width, y: pipeBottomY });
        }
    }
    return entities;
};

const GameOver = (entities: any, { dispatch }: any) => {
    const bird = entities.Bird.body;
    const { height } = entities.physics.dimensions;

    // Ground and ceiling collision
    if (bird.bounds.max.y >= height || bird.bounds.min.y <= 0) {
        dispatch({ type: 'game-over', score: entities.score });
    }

    // Pipe collision
    const pipes = [
        entities.Pipe1Top.body,
        entities.Pipe1Bottom.body,
        entities.Pipe2Top.body,
        entities.Pipe2Bottom.body,
    ];
    if (Matter.Query.collides(bird, pipes).length > 0) {
        dispatch({ type: 'game-over', score: entities.score });
    }

    return entities;
};


// --- GAME COMPONENT ---
interface FlappyGameProps {
    onEvent: (event: { type: string, score?: number }) => void;
    birdImageUri: string;
    width: number;
    height: number;
}

export default function FlappyGame({ onEvent, birdImageUri, width, height }: FlappyGameProps) {
    const gameEngine = useRef<GameEngine>(null);

    const setupEntities = () => {
        const engine = Matter.Engine.create({ enableSleeping: false });
        const world = engine.world;
        
        // Scale game physics constants based on screen height for consistency
        const scale = height / 800; // Assuming 800 is a baseline height
        const birdSize = BIRD_SIZE_BASE * scale;
        const pipeWidth = PIPE_WIDTH_BASE * scale;
        const gapSize = GAP_SIZE_BASE * scale;
        const jumpHeight = 8 * scale;
        const speed = 3 * scale;

        engine.gravity.y = 0.6 * scale;

        const bird = Matter.Bodies.circle(width / 4, height / 2, birdSize / 2, { label: 'Bird' });

        const pipe1TopY = Math.random() * (height - gapSize - 200) + 100;
        const pipe1BottomY = pipe1TopY + gapSize + height / 2;
        const pipe2TopY = Math.random() * (height - gapSize - 200) + 100;
        const pipe2BottomY = pipe2TopY + gapSize + height / 2;

        const entities = {
            physics: { 
                engine, 
                world, 
                jumpHeight,
                speed,
                dimensions: { width, height, gapSize } 
            },
            Bird: { body: bird, imageUri: birdImageUri, renderer: Bird },
            Floor: { body: Matter.Bodies.rectangle(width / 2, height, width, 50, { isStatic: true, label: 'Floor' }), renderer: Wall },
            
            Pipe1Top: { body: Matter.Bodies.rectangle(width, pipe1TopY - height/2, pipeWidth, height, { isStatic: true, label: 'PipeTop' }), scored: false, renderer: Wall },
            Pipe1Bottom: { body: Matter.Bodies.rectangle(width, pipe1BottomY, pipeWidth, height, { isStatic: true, label: 'PipeBottom' }), scored: false, renderer: Wall },

            Pipe2Top: { body: Matter.Bodies.rectangle(width * 1.5 + pipeWidth / 2, pipe2TopY - height/2, pipeWidth, height, { isStatic: true, label: 'PipeTop' }), scored: false, renderer: Wall },
            Pipe2Bottom: { body: Matter.Bodies.rectangle(width * 1.5 + pipeWidth / 2, pipe2BottomY, pipeWidth, height, { isStatic: true, label: 'PipeBottom' }), scored: false, renderer: Wall },
            score: 0,
        };
        
        Matter.Composite.add(world, Object.values(entities).map((e: any) => e.body).filter(b => b));

        return entities;
    };
    
    // Cross-platform keyboard and mouse/touch controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                 if (gameEngine.current) {
                    (gameEngine.current as any).dispatch({ type: 'start' });
                }
            }
        };

        if (Platform.OS === 'web') {
            window.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            if (Platform.OS === 'web') {
                window.removeEventListener('keydown', handleKeyPress);
            }
        };
    }, []);

    return (
        <Pressable style={styles.container} onPress={() => (gameEngine.current as any)?.dispatch({ type: 'start' })}>
            <GameEngine
                ref={gameEngine}
                style={styles.gameContainer}
                systems={[Physics, Jump, PipeMovement, GameOver]}
                entities={setupEntities()}
                onEvent={(e) => {
                    if (e.type === 'game-over') {
                       (gameEngine.current as any)?.stop();
                    }
                    onEvent(e);
                }}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gameContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    bird: {
        position: 'absolute',
        resizeMode: 'contain',
    },
    wall: {
        position: 'absolute',
        backgroundColor: '#008000', // Green pipes
        borderWidth: 2,
        borderColor: '#000',
    },
});