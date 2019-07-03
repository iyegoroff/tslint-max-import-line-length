import * as Lint from 'tslint'
import { getLineRanges, LineRange } from 'tsutils/util'
import ts from 'typescript'

interface MaxLineLengthRuleOptions {
  limit: number
}

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    ruleName: 'max-import-line-length',
    description: 'Requires import lines to be under a certain max length.',
    rationale: Lint.Utils.dedent`
      Limiting the length of a line of code improves code readability.
      It also makes comparing code side-by-side easier and improves compatibility with
      various editors, IDEs, and diff viewers.`,
    optionsDescription: 'Integer indicating maximum length of lines.',
    options: {
      type: 'array',
      items: { type: 'number' }
    },
    optionExamples: [
      [true, 100]
    ],
    type: 'formatting',
    typescriptOnly: false,
    hasFix: true
  }

  public static FAILURE_STRING_FACTORY(lineLimit: number): string {
    return `Exceeds maximum import line length of ${lineLimit}`
  }

  public isEnabled(): boolean {
    const limit = this.getRuleOptions().limit
    return super.isEnabled() && limit > 0
  }

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk, this.getRuleOptions())
  }

  private getRuleOptions(): MaxLineLengthRuleOptions {
    const argument = this.ruleArguments[0]
    const options: MaxLineLengthRuleOptions = { limit: +argument }
    return options
  }
}

const walk = (ctx: Lint.WalkContext<MaxLineLengthRuleOptions>) => {
  const { sourceFile, options: { limit } } = ctx

  for (const line of getLineRanges(sourceFile)) {
    const lineContent = sourceFile.text.substr(line.pos, line.contentLength)

    if (line.contentLength > limit && lineContent.startsWith('import')) {
      ctx.addFailureAt(
        line.pos,
        line.contentLength,
        Rule.FAILURE_STRING_FACTORY(limit),
        fix(line, lineContent)
      )
    }
  }
}

const fix = (line: LineRange, lineContent: string) => {
  const replacement = lineContent
    .replace(/([^\}])(,|\{)\s+([^\{])/g, '$1$2\n  $3')
    .replace(/\s+\}/, '\n}')

  return new Lint.Replacement(line.pos, line.contentLength, replacement)
}
