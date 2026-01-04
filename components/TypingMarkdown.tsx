import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import Markdown from "react-native-markdown-display";




interface TypingMarkdownProps {
    text: string;
    isUser: boolean;
    speed?: number;
    onComplete?: () => void
    isAlreadyCompleted?: boolean
}


export default function TypingMarkdown({
    text, isUser, speed = 30, onComplete, isAlreadyCompleted = false }: TypingMarkdownProps
) {

    const [displayedText, setDisplayedText] = useState(isAlreadyCompleted ? text : "")

    const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted)

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined
    );

    const indexRef = useRef(0);

    useEffect(() => {

        if (isAlreadyCompleted) {
            setDisplayedText(text)
            setIsCompleted(false)

            return;
        }

        // Reset state when text changes

        setDisplayedText("");
        setIsCompleted(false);

        indexRef.current = 0;

        const typeText = () => {
            if (indexRef.current < text.length) {
                setDisplayedText(text.slice(0, indexRef.current + 1))

                indexRef.current += 1;


                // Calculate delay based on speed ( character per second )

                const delay = 1000 / speed;

                timeoutRef.current = setTimeout(typeText, delay);
            } else {
                setIsCompleted(true);
                onComplete?.();
            }


        };

        timeoutRef.current = setTimeout(typeText, 100);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };


    }, [text, speed, onComplete, isAlreadyCompleted])


    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);


            }
        };
    }, []);

    const textStyle = {
        color: isUser ? "white" : "#1f2937",
        fontFamily: "RubikRegular",
        fontSize: 14,
        lineHeight: 20,
    }


    // Show plain text with cursor while typing

    if (!isCompleted) {
        return <Text style={textStyle}>{displayedText}</Text>
    }

    return (

        <Markdown style={{
            body: {
                ...textStyle,
                marginTop: 0,
                marginBottom: 0,
            },
            paragraph: {
                marginTop: 0,
                marginBottom: 0,
            },
            strong: {
                fontFamily: "RubikSemiBold",
                color: isUser ? "white" : "#1f2937",
            },
            em: {
                fontFamily: "RubikMedium",
                fontStyle: "italic",
            },
            code_inline: {
                paddingHorizontal: 4,
                backgroundColor: isUser ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
                paddingVertical: 2,
                borderRadius: 4,
                fontFamily: "RubikRegular",
                fontSize: 14,
            },
            code_block: {
                backgroundColor: isUser ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                padding: 8,
                borderRadius: 8,
                marginVertical: 4,
            },

            heading1: {
                fontFamily: "RubikBold",
                fontSize: 18,
                marginBottom: 4,
                color: isUser ? "white" : "#1f2937",
                marginTop: 8,
            },
            heading2: {
                fontFamily: "RubikBold",
                fontSize: 16,
                marginBottom: 4,
                color: isUser ? "white" : "#1f2937",
                marginTop: 6,
            },

            bullet_list: {
                marginVertical: 4,
            },
            ordered_list: {
                marginVertical: 4,
            },
            list_item: {
                marginVertical: 2,

            },
            link: {
                color: isUser ? "#93c5fd" : "#2563eb",
                
            },



        }}
        >
            {text}

        </Markdown>
    )

}

