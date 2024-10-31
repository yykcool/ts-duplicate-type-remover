import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

function removeDuplicateTypes(filePath: string): void {
  // Read the file
  const fileContent = fs.readFileSync(filePath, "utf-8");

  // Create a source file
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  // Create a map to store unique type definitions
  const uniqueTypes = new Map<string, ts.Node>();

  const transformerFactory: ts.TransformerFactory<ts.SourceFile> =
    (context) => (sourceFile) => {
      // Function to process nodes
      function visit(node: ts.Node): ts.Node | undefined {
        // Check if the node is a type alias declaration, interface declaration, or enum declaration
        if (
          ts.isTypeAliasDeclaration(node) ||
          ts.isInterfaceDeclaration(node) ||
          ts.isEnumDeclaration(node)
        ) {
          const name = node.name.text;
          if (!uniqueTypes.has(name)) {
            uniqueTypes.set(name, node);
            return node;
          }
          return undefined;
        }

        return ts.visitEachChild(node, visit, context);
      }
      return ts.visitNode(sourceFile, visit) as ts.SourceFile;
    };

  // Transform the source file
  const result = ts.transform(sourceFile, [transformerFactory]);

  // Generate the new source file
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const transformedContent = printer.printFile(
    result.transformed[0] as ts.SourceFile
  );

  // Write the transformed content back to the file
  fs.writeFileSync(filePath, transformedContent, "utf-8");

  console.log(`Duplicate types removed from ${filePath}`);
}

// Usage
const filePath = path.join(process.cwd(), "gql", "graphql.ts");
removeDuplicateTypes(filePath);