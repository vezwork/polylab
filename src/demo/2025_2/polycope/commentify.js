if (e.commentify) {
          const [x, y] = linePosFromAdr(getAdr().caret);
          const lineIndexes = new Set([
            y,
            ...adr.selected.map(linePosFromAdr).map(([x, y]) => y),
          ]);
          let prevCaretPos = getAdr().caret[1];
          let prevAnchorPos = getAdr().anchor[1];
          for (const y of lineIndexes) {
            const pos = posFromAdrAndLinePos(getAdr().caret, [0, y]);
            const line = lineFromAdr(withPos(getAdr().caret, pos));
            if (line.startsWith("//")) {
              setAdr(
                withCaretAdr(
                  getAdr(),
                  withPos(
                    getAdr().caret,
                    posFromAdrAndLinePos(getAdr().caret, [2, y])
                  )
                )
              );
              elFromAdr(getAdr().caret).act({ key: "Backspace" });
              elFromAdr(getAdr().caret).act({ key: "Backspace" });
              // Math.max is used so the caret won't get pushed to the previous line
              if (prevCaretPos > getAdr().caret[1])
                prevCaretPos = Math.max(prevCaretPos - 2, getAdr().caret[1]);
              if (prevAnchorPos > getAdr().caret[1])
                prevAnchorPos = Math.max(prevAnchorPos - 2, getAdr().caret[1]);
            } else {
              setAdr(
                withCaretAdr(
                  getAdr(),
                  withPos(
                    getAdr().caret,
                    posFromAdrAndLinePos(getAdr().caret, [0, y])
                  )
                )
              );
              elFromAdr(getAdr().caret).act({ key: "/" });
              elFromAdr(getAdr().caret).act({ key: "/" });
              if (prevCaretPos > getAdr().caret[1] - 2) prevCaretPos += 2;
              if (prevAnchorPos > getAdr().caret[1] - 2) prevAnchorPos += 2;
            }
          }
          setAdr(withCaretAdr(getAdr(), withPos(getAdr().caret, prevCaretPos)));
          setAdr(
            withAnchorAdr(getAdr(), withPos(getAdr().anchor, prevAnchorPos))
          );
          continue;
        }
        if (e.spacify || e.despacify) {
          const [x, y] = linePosFromAdr(getAdr().caret);
          const lineIndexes = new Set([
            y,
            ...adr.selected.map(linePosFromAdr).map(([x, y]) => y),
          ]);
          let prevCaretPos = getAdr().caret[1];
          let prevAnchorPos = getAdr().anchor[1];
          if (e.spacify) {
            for (const y of lineIndexes) {
              setAdr(
                withCaretAdr(
                  getAdr(),
                  withPos(
                    getAdr().caret,
                    posFromAdrAndLinePos(getAdr().caret, [0, y])
                  )
                )
              );
              elFromAdr(getAdr().caret).act({ key: " " });
              elFromAdr(getAdr().caret).act({ key: " " });
              if (prevCaretPos > getAdr().caret[1] - 2) prevCaretPos += 2;
              if (prevAnchorPos > getAdr().caret[1] - 2) prevAnchorPos += 2;
            }
          }
          if (e.despacify) {
            for (const y of lineIndexes) {
              setAdr(
                withCaretAdr(
                  getAdr(),
                  withPos(
                    getAdr().caret,
                    posFromAdrAndLinePos(getAdr().caret, [2, y])
                  )
                )
              );
              const line = lineFromAdr([getAdr().caret[0], pos]);
              if (!line.startsWith("  ")) continue;
              setAdr(withCaretAdr(getAdr(), withPos(getAdr().caret, pos)));
              elFromAdr(getAdr().caret).act({ key: "Backspace" });
              elFromAdr(getAdr().caret).act({ key: "Backspace" });
              // Math.max is used so the caret won't get pushed to the previous line
              if (prevCaretPos > getAdr().caret[1])
                prevCaretPos = Math.max(prevCaretPos - 2, getAdr().caret[1]);
              if (prevAnchorPos > getAdr().caret[1])
                prevAnchorPos = Math.max(prevAnchorPos - 2, getAdr().caret[1]);
            }
          }
          setAdr(withCaretAdr(getAdr(), withPos(getAdr().caret, prevCaretPos)));
          setAdr(
            withAnchorAdr(getAdr(), withPos(getAdr().anchor, prevAnchorPos))
          );
          continue;
        }